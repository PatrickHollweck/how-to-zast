import * as t from "./prompts/types.js";
import type { PromptContext } from "./prompts/context.js";

export async function findBillingType(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): Promise<[number, t.BillingType] | null> {
  if ((await ctx.prompts.szenario()) === t.CallScenario.HuLaPlaÜbernahme) {
    handleVerlegung(ctx, t.BillingContextTyp.KTP, false);
  }

  switch (billingContext) {
    case t.BillingContextTyp.KTP:
      return null;
    case t.BillingContextTyp.NF:
      return null;
    case t.BillingContextTyp.NA:
      return handleDoctorCall(ctx, billingContext);
    default:
      throw new Error(
        `Unbekannter Tarif-Context! - angegeben: "${billingContext}"`
      );
  }
}

async function handleDoctorCall(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): Promise<[t.BillingTariff, t.BillingType]> {
  switch (await ctx.prompts.notfallSzenarioMitNA()) {
    case t.EmergencyScenario_NA.Verlegung:
      return handleVerlegung(ctx, billingContext, true);
    case t.EmergencyScenario_NA.Schulunfall:
    case t.EmergencyScenario_NA.ArbeitsOderWegeUnfall: {
      ctx.setCached("istUrsacheBG", true);

      const isBG = await handleBerufsgenossenschaftBilling(ctx, billingContext);

      if (isBG) {
        return isBG;
      }

      throw new Error(
        "Ein Arbeits-, Wege-, oder Schulunfall muss über die BG abgerechnet werden."
      );
    }

    case t.EmergencyScenario_NA.SonstigerNofall:
    case t.EmergencyScenario_NA.SonstigerUnfall: {
      if (!(await ctx.prompts.wurdePatientTransportiert())) {
        const isBG = await handleBerufsgenossenschaftBilling(
          ctx,
          billingContext
        );

        if (isBG) {
          return isBG;
        }
      }
    }

    case t.EmergencyScenario_NA.Internistisch:
    case t.EmergencyScenario_NA.Verkehrsunfall:
      return (await ctx.prompts.istPrivateOderUnbekannteKrankenkasse())
        ? [t.BillingTariff.NA_SZ, t.BillingType.SZ]
        : [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];

    default:
      throw new Error("Unbekannter Notfalltyp");
  }
}

async function handleVerlegung(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp,
  verlegungInKrankenhaus: boolean
): Promise<[t.BillingTariff, t.BillingType]> {
  const isBG = await handleBerufsgenossenschaftBilling(ctx, billingContext);

  if (isBG) {
    return isBG;
  }

  if (verlegungInKrankenhaus) {
    if (await ctx.prompts.verlegungInKrankenhausNiedrigerVersorungsstufe()) {
      return [getKrankenhausTarif(billingContext), t.BillingType.KHS];
    }
  }

  if (await ctx.prompts.istPrivateOderUnbekannteKrankenkasse()) {
    return [getSelbstzahlerTarif(billingContext), t.BillingType.SZ];
  }

  return [getKrankenkasseTarif(billingContext), t.BillingType.KTR];
}

async function handleBerufsgenossenschaftBilling(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): Promise<[t.BillingTariff, t.BillingType] | null> {
  if (await ctx.prompts.istUrsacheBG()) {
    await ctx.io.message(
      t.MessageType.Info,
      "Name und Anschrift des Arbeitgeber (bzw. Schule) in ZAST-Info Feld oder auf Transportschein notieren!"
    );

    if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
      return [getBerufsgenossenschaftTarif(billingContext), t.BillingType.BG];
    }

    await ctx.io.message(
      t.MessageType.Info,
      "In diesem Fall muss eine Privatrechnung ausgestellt werden. Der Patient kann diese nach Klärung des Trägers einreichen!"
    );

    return [getSelbstzahlerTarif(billingContext), t.BillingType.SZ];
  }

  return null;
}

function getBerufsgenossenschaftTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KTR_BG,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_KTR_BG,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_KTR_BG,
  }[billingContext];
}

function getSelbstzahlerTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_SZ,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_SZ,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_SZ,
  }[billingContext];
}

function getKrankenhausTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KHS,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_KHS,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_KHS,
  }[billingContext];
}

function getKrankenkasseTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KTR_BG,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_KTR_BG,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_KTR_BG,
  }[billingContext];
}
