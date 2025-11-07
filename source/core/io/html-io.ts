import "bootstrap";

import { marked } from "marked";
import { PromptIOProvider, type SelectOptions } from "./io-provider.js";

import * as t from "../prompts/types.js";

export class HtmlIO extends PromptIOProvider {
	private isFirstScroll = true;

	override async message(
		type: t.MessageType,
		...messages: string[]
	): Promise<void> {
		const container$ = document.createElement("div");
		container$.setAttribute("role", "alert");

		container$.classList.add(
			"alert",
			"d-flex",
			"align-items-center",
			"row",
			"mt-4",
			"mb-2",
			"border-2",
			"shadow",
			"fs-5",
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
					"border-2",
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
      <div class="d-flex mb-2">
        <span class="bi flex-shrink-0 me-3 ${icon}"></span>
        ${await this.md2html(messages.join(" "))}
      </div>`;

		const divider$ = document.createElement("hr");
		container$.appendChild(divider$);

		const confirmButton$ = document.createElement("button");
		confirmButton$.classList.add("btn", "btn-primary");
		confirmButton$.textContent = "Bestätigen";

		container$.appendChild(confirmButton$);

		this.append(container$);

		this.scrollToTargetAdjusted(container$);

		if (type === t.MessageType.Error) {
			this.appendResultButtons();
		}

		return new Promise((resolve) => {
			confirmButton$.addEventListener("click", () => {
				divider$.remove();
				confirmButton$.remove();
				resolve();
			});
		});
	}

	override async select<T>(options: SelectOptions<T>): Promise<T> {
		const buttons: { option: T; button: HTMLButtonElement }[] = [];
		const elements: HTMLElement[] = [];

		for (const option of options.choices) {
			const button$ = document.createElement("button");
			button$.innerHTML = await this.md2html(option.name);

			button$.classList.add(
				"btn",
				"btn-primary",
				"col",
				"py-2",
				"px-4",
				"fs-6",
				"rounded-top",
				options.choices.length > 2 ? "text-start" : "text-center",
			);

			buttons.push({
				button: button$,
				option: option.value,
			});

			const container$ = document.createElement("div");
			container$.classList.add("mx-2", "my-2", "flex-grow-1");
			container$.append(button$);

			if (option.description?.trim() != null) {
				container$.classList.add(
					"d-flex",
					"flex-column",
					"bg-primary-subtle",
					"rounded-bottom",
				);

				const description$ = document.createElement("span");
				description$.innerHTML = await this.md2html(option.description);

				description$.classList.add(
					"option-description",
					"border",
					"border-top-0",
					"border-primary-subtle",
					"border-3",
					"md2html",
					"p-2",
					"d-none",
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
			"align-self-centert",
		);

		explainButton$.addEventListener("click", () => {
			for (const { button: button$ } of buttons) {
				button$.parentElement
					?.querySelector(".option-description")
					?.classList.toggle("d-none");

				button$.parentElement?.classList.toggle("rounded-bottom");
				button$.style.setProperty("--bs-btn-border-radius", "0");
			}
		});

		const card$ = await this.createCard(options.title, elements, {
			description: options.description ?? null,
			cardClasses: ["border-primary"],
			extraHeaderElements: options.choices.some(
				(option) => option.description != null,
			)
				? [explainButton$]
				: null,
		});

		return new Promise((resolve) => {
			for (const { button: button$, option } of buttons) {
				button$.addEventListener("click", () => {
					for (const { button: innerButton } of buttons) {
						innerButton.classList.add("btn-secondary");
						innerButton.disabled = true;
					}

					card$.classList.remove("border-primary");
					button$.classList.add("btn-success");

					resolve(option);
				});
			}
		});
	}

	override async displayError(e: unknown): Promise<void> {
		console.error(e);

		if (
			typeof e === "object" &&
			e != null &&
			typeof e.toString === "function"
		) {
			// eslint-disable-next-line @typescript-eslint/no-base-to-string
			await this.message(t.MessageType.Error, `Fehler: ${String(e)}`);
		}
	}

	async displayResult(
		transportType: t.TransportType,
		callType?: t.CallType | null,
		tariffType?: [t.BillingTariff, t.BillingType] | null,
	): Promise<void> {
		const display$ = document.createElement("div");
		display$.classList.add("fs-5");

		display$.innerHTML = await this.md2html(`
- Transportart: **${transportType.toString()}**
- Einsatzart: **${callType?.toString() ?? "keine Angabe"}**
- Tarif: **${tariffType?.[0].toString() ?? "keine Angabe"}**
- Kostenträgertyp: **${tariffType?.[1] ?? "keine Angabe"}**`);

		await this.createCard("Einsatzabrechnung", [display$], {
			description:
				"Angaben ohne Gewähr. Um eine neue Abfrage zu starten, einfach die Seite neu laden.",
			cardClasses: ["text-bg-primary"],
		});

		this.appendResultButtons();
	}

	private append(element: HTMLElement) {
		const renderArea = document.getElementById("render-area");

		if (renderArea == null) {
			throw new Error("Could not find #render-area");
		}

		renderArea.insertAdjacentElement("beforeend", element);
	}

	private appendResultButtons() {
		const container$ = document.createElement("div");
		container$.classList.add("row", "mt-4", "d-flex", "gap-2", "flex-row");

		const resetButton$ = document.createElement("button");
		resetButton$.classList.add("btn", "btn-secondary", "w-auto");
		resetButton$.innerText = "Abfrage zurücksetzen";
		resetButton$.addEventListener("click", () => {
			window.location.reload();
		});

		const reportButton$ = document.createElement("button");
		reportButton$.classList.add("btn", "btn-secondary", "w-auto");
		reportButton$.innerText = "Fehler melden";
		reportButton$.addEventListener("click", () =>
			window.open("mailto:sentry@patrick-hollweck.de"),
		);

		container$.append(resetButton$);
		container$.append(reportButton$);

		this.append(container$);
	}

	private async md2html(text: string) {
		return `<div class="md2html">${await marked.parse(text.trim(), {
			gfm: true,
		})}</div>`;
	}

	private scrollToTargetAdjusted(element: HTMLElement, offset = 100) {
		if (this.isFirstScroll) {
			this.isFirstScroll = false;
			return;
		}

		const elementPosition = element.getBoundingClientRect().top;
		const offsetPosition = elementPosition + window.pageYOffset - offset;

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
			extraFooterElements?: HTMLElement[] | null;
		},
	) {
		const container$ = document.createElement("div");
		container$.classList.add(
			"card",
			"row",
			"mt-4",
			"mb-2",
			"border-2",
			"shadow",
			...(options?.cardClasses ?? []),
		);

		const titleDisplay$ = document.createElement("div");
		titleDisplay$.classList.add(
			"card-header",
			"fs-5",
			"d-flex",
			"px-4",
			"justify-content-between",
			"align-items-center",
		);

		titleDisplay$.innerHTML = await this.md2html(title);

		for (const extraElement of options?.extraHeaderElements ?? []) {
			titleDisplay$.appendChild(extraElement);
		}

		container$.appendChild(titleDisplay$);

		const bodyContainer$ = document.createElement("div");
		bodyContainer$.classList.add(
			"card-body",
			"d-flex",
			"flex-wrap",
			content.length >= 4 ? "flex-column" : "flex-row",
		);

		for (const element of content) {
			bodyContainer$.append(element);
		}

		container$.append(bodyContainer$);

		if (
			options?.description != null ||
			(options?.extraFooterElements?.length ?? 0) > 0
		) {
			const descriptionContainer$ = document.createElement("div");

			descriptionContainer$.classList.add("card-footer", "md2html");

			if (options?.description) {
				descriptionContainer$.innerHTML = await this.md2html(
					options.description,
				);
			}

			if (options?.extraFooterElements) {
				for (const element of options.extraFooterElements) {
					descriptionContainer$.appendChild(element);
				}
			}

			container$.appendChild(descriptionContainer$);
		}

		this.append(container$);
		this.scrollToTargetAdjusted(container$);

		return container$;
	}
}
