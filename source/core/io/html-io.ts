import "bootstrap";

import { marked } from "marked";
import { PromptIOProvider } from "./io-provider.js";

import * as t from "../prompts/types.js";

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
    options?: {
      description?: string | null;
      cardClasses?: string[];
      extraHeaderElements?: HTMLElement[] | null;
    }
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
    titleDisplay$.classList.add(
      "card-header",
      "fs-4",
      "d-flex",
      "px-4",
      "justify-content-between",
      "align-items-center"
    );

    titleDisplay$.textContent = title;

    for (const extraElement of options?.extraHeaderElements ?? []) {
      titleDisplay$.appendChild(extraElement);
    }

    container$.appendChild(titleDisplay$);

    const bodyContainer$ = document.createElement("div");
    bodyContainer$.classList.add(
      "card-body",
      "d-flex",
      "flex-wrap",
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

  async message(type: t.MessageType, ...messages: any[]): Promise<void> {
    const container$ = document.createElement("div");

    container$.classList.add(
      "alert",
      "d-flex",
      "align-items-center",
      "md2html",
      "row",
      "mt-4",
      "mb-2",
      "border-2",
      "shadow",
      "fs-5"
    );

    let icon = "";
    switch (type) {
      case t.MessageType.Info:
        icon = "bi-info-circle-fill";
        container$.classList.add("alert-primary");
        break;
      case t.MessageType.Warning:
        icon = "bi-exclamation-triangle-fill";
        container$.classList.add("alert-warning");
        break;
      case t.MessageType.Alert:
        icon = "bi-exclamation-triangle-fill";
        container$.classList.add(
          "alert-warning",
          "border",
          "border-danger",
          "border-2"
        );
        break;
      case t.MessageType.Success:
        icon = "bi-check-circle-fill";
        container$.classList.add("alert-success");
        break;
      case t.MessageType.Error:
        icon = "bi-lightning-charge-fill";
        container$.classList.add("alert-danger");
        break;
    }

    container$.innerHTML = `
      <div class="d-flex">
        <span class="bi flex-shrink-0 me-3 ${icon}"></span>
        ${await this.md2html(messages.join(" "))}
      </div>`;

    container$.setAttribute("role", "alert");

    this.append(container$);
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
          "fs-5",
          "rounded-top",
          options.choices.length > 2 ? "text-start" : "text-center"
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
          container$.classList.add(
            "d-flex",
            "flex-column",
            "bg-primary-subtle",
            "rounded-bottom"
          );

          const description$ = document.createElement("span");

          description$.innerHTML = `
            <div class="d-flex">
              <span class="bi flex-shrink-0 me-2 bi-info-circle-fill"></span>
              ${await this.md2html(option.description)}
            </div>`;

          description$.classList.add(
            "option-description",
            "border",
            "border-top-0",
            "border-primary-subtle",
            "border-3",
            "md2html",
            "p-2",
            "d-none"
          );

          container$.append(description$);
        } else {
          container$.classList.add("d-flex");
        }

        elements.push(container$);
      }

      const explainButton$ = document.createElement("button");
      explainButton$.innerHTML = "<b>?</b>";
      explainButton$.classList.add(
        "btn",
        "btn-sm",
        "btn-dark",
        "rounded-xl",
        "justify-self-end",
        "w-min"
      );

      explainButton$.addEventListener("click", () => {
        for (const button$ of buttons) {
          button$.parentElement
            ?.querySelector(".option-description")
            ?.classList.toggle("d-none");

          button$.parentElement?.classList.toggle("rounded-bottom");
          button$.style.setProperty("--bs-btn-border-radius", "0");
        }
      });

      card$ = await this.createCard(options.title, elements, {
        description: options.description ?? null,
        cardClasses: ["border-primary"],
        extraHeaderElements: options.choices.some(
          (option) => option.description != null
        )
          ? [explainButton$]
          : null,
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
