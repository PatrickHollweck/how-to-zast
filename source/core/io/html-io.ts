import "bootstrap";

import { marked } from "marked";
import { Popover } from "bootstrap";

import { PromptIOProvider } from "./io-provider.js";

import type * as t from "../prompts/types.js";

export class HtmlIO extends PromptIOProvider {
  private renderArea: HTMLElement;

  constructor() {
    super();

    this.renderArea = document.getElementById("render-area")!;
  }

  private append(element: HTMLElement) {
    this.renderArea.insertAdjacentElement("beforeend", element);
  }

  private async md2html(text: string) {
    return await marked.parse(text.trim(), { gfm: true });
  }

  private scrollToTargetAdjusted(element: HTMLElement, offset: number = 100) {
    var elementPosition = element.getBoundingClientRect().top;
    var offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition <= 0 ? 0 : offsetPosition,
      behavior: "smooth",
    });
  }

  private async createCard(
    title: string,
    content: HTMLElement[],
    options?: { description?: string | null; cardClasses?: string[] }
  ) {
    const container$ = document.createElement("div");
    container$.classList.add(
      "card",
      "row",
      "mt-4",
      "mb-2",
      "border-2",
      "shadow",
      ...(options?.cardClasses ?? [])
    );

    const titleDisplay$ = document.createElement("div");
    titleDisplay$.classList.add("card-header", "fs-4");
    titleDisplay$.textContent = title;
    container$.appendChild(titleDisplay$);

    const bodyContainer$ = document.createElement("div");
    bodyContainer$.classList.add(
      "card-body",
      "d-flex",
      content.length >= 4 ? "flex-column" : "flex-row"
    );

    for (const element of content) {
      bodyContainer$.append(element);
    }

    container$.append(bodyContainer$);

    if (options?.description != null) {
      const description$ = document.createElement("div");

      description$.classList.add("card-footer", "md2html");
      description$.innerHTML = await this.md2html(options.description);

      container$.appendChild(description$);
    }

    this.append(container$);
    this.scrollToTargetAdjusted(container$);

    return container$;
  }

  async message(...messages: any[]): Promise<void> {
    const p = document.createElement("p");
    p.textContent = `${messages.join(" ")}`;

    this.append(p);
  }

  select<T>(options: {
    title: string;
    description?: string;
    choices: { name: string; value: T; description?: string }[];
  }): Promise<T> {
    return new Promise(async (resolve) => {
      let card$: HTMLElement | null = null;
      const buttons: HTMLButtonElement[] = [];
      const elements: HTMLElement[] = [];

      for (const option of options.choices) {
        const button$ = document.createElement("button");
        button$.textContent = option.name;

        button$.classList.add(
          "btn",
          "btn-primary",
          "col",
          "py-2",
          "text-start",
          "fs-5"
        );

        button$.addEventListener("click", () => {
          for (const button of buttons) {
            button.classList.add("btn-secondary");
            button.disabled = true;
          }

          card$?.classList.remove("border-primary");
          button$.classList.add("btn-success");

          resolve(option.value);
        });

        buttons.push(button$);

        const container$ = document.createElement("div");
        container$.classList.add("mx-2", "my-2", "flex-grow-1");
        container$.append(button$);

        if (option.description?.trim() != null) {
          container$.classList.add("btn-group");

          const description$ = document.createElement("a");
          description$.classList.add(
            "d-flex",
            "justify-content-center",
            "align-items-center"
          );

          description$.classList.add("btn", "btn-secondary", "md2html");
          description$.style = "max-width: fit-content";
          description$.innerHTML = "?";
          description$.setAttribute("tabindex", "0");
          description$.setAttribute("role", "button");
          description$.setAttribute("data-bs-toggle", "popover");
          description$.setAttribute("data-bs-title", "Beschreibung");
          description$.setAttribute("data-bs-content", option.description);
          description$.setAttribute(
            "data-bs-custom-class",
            "description-popover"
          );

          new Popover(description$, { trigger: "focus" });

          container$.append(description$);
        } else {
          container$.classList.add("d-flex");
        }

        elements.push(container$);
      }

      card$ = await this.createCard(options.title, elements, {
        description: options.description ?? null,
        cardClasses: ["border-primary"],
      });
    });
  }

  async displayError(e: unknown): Promise<void> {
    console.log(e);
    throw new Error("Method not implemented.");
  }

  async displayResult(
    transportType: t.TransportType,
    callType?: t.CallType | null,
    tariffType?: [t.BillingTariff, t.BillingType] | null
  ): Promise<void> {
    const display$ = document.createElement("div");
    display$.classList.add("fs-4");

    display$.innerHTML = await this.md2html(`
- Transportart: **${transportType}**
- Einsatzart: **${callType ?? "keine Angabe"}**
- Tarif: **${tariffType?.[0] ?? "keine Angabe"}**
- Kostenträgertyp: **${tariffType?.[1] ?? "keine Angabe"}**`);

    await this.createCard("Einsatzabrechnung", [display$], {
      description: "Angaben ohne Gewähr",
      cardClasses: ["text-bg-primary"],
    });
  }
}
