import * as t from "./prompts/types.js";
import type { PromptContext } from "./prompts/context.js";

type BillingTypeReturn = Promise<[t.BillingTariff, t.BillingType]>;

export async function findBillingType(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): Promise<[number, t.BillingType] | null> {
  if ((await ctx.prompts.szenario()) === t.CallScenario.HuLaPlaÜbernahme) {
    return await handle_KTR_SZ(ctx, t.BillingContextTyp.KTP);
  }

  switch (billingContext) {
    case t.BillingContextTyp.KTP:
      return null;
    case t.BillingContextTyp.KTP_Herabstufung:
      return await handleKTPHerabstufung(ctx);
    case t.BillingContextTyp.NF:
      return null;
    case t.BillingContextTyp.NA:
      return await handleDoctorCall(ctx);
    default:
      throw new Error(
        `Unbekannter Tarif-Context! - angegeben: "${billingContext}"`
      );
  }
}

async function handleKTPHerabstufung(ctx: PromptContext): BillingTypeReturn {
  switch (await ctx.prompts.herabstufungGrundKTP()) {
    case t.EmergencyScenario_NF_Downgrade.ArbeitsOderWegeOderSchulUnfall:
      ctx.setCached("istUrsacheBG", true);
      return await handle_BG_KTR_SZ(ctx, t.BillingContextTyp.KTP_Herabstufung);
    case t.EmergencyScenario_NF_Downgrade.SonstigerEinsatz:
      ctx.setCached("istUrsacheBG", false);
      return await handle_BG_SZ_forced(
        ctx,
        t.BillingContextTyp.KTP_Herabstufung
      );
    case t.EmergencyScenario_NF_Downgrade.SonstigerUnfall:
      return await handle_KTR_SZ(ctx, t.BillingContextTyp.KTP_Herabstufung);
  }
}

async function handleDoctorCall(ctx: PromptContext): BillingTypeReturn {
  switch (await ctx.prompts.notfallSzenarioMitNA()) {
    case t.EmergencyScenario_NA.Verlegung:
      return await handleVerlegung(ctx, t.BillingContextTyp.NA);
    case t.EmergencyScenario_NA.Schulunfall:
    case t.EmergencyScenario_NA.ArbeitsOderWegeUnfall:
      ctx.setCached("istUrsacheBG", true);
      return await handle_BG_SZ_forced(ctx, t.BillingContextTyp.NA);

    case t.EmergencyScenario_NA.SonstigerNofall:
    case t.EmergencyScenario_NA.SonstigerUnfall:
      return await handle_BG_KTR_SZ(ctx, t.BillingContextTyp.NA);

    case t.EmergencyScenario_NA.Internistisch:
    case t.EmergencyScenario_NA.Verkehrsunfall:
      return await handle_KTR_SZ(ctx, t.BillingContextTyp.NA);

    default:
      throw new Error("Unbekannter Notfalltyp");
  }
}

async function handle_KTR_SZ(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): BillingTypeReturn {
  return (await ctx.prompts.istPrivateOderUnbekannteKrankenkasse())
    ? [getSelbstzahlerTarif(billingContext), t.BillingType.SZ]
    : [getKrankenkasseTarif(billingContext), t.BillingType.KTR];
}

async function handle_BG_SZ(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): Promise<[t.BillingTariff, t.BillingType] | null> {
  if (!(await ctx.prompts.istUrsacheBG())) {
    return null;
  }

  await ctx.messages.hinweisEintragungAbrechnungsdatenBG();

  if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
    return [getBerufsgenossenschaftTarif(billingContext), t.BillingType.BG];
  }

  await ctx.messages.hinweiseUnbekannterKTR();

  return [getSelbstzahlerTarif(billingContext), t.BillingType.SZ];
}

async function handle_BG_SZ_forced(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): BillingTypeReturn {
  const isBG = await handle_BG_SZ(ctx, billingContext);

  if (isBG) {
    return isBG;
  }

  await ctx.messages.keinKostenträgerFehlermeldung();

  throw new Error("Abrechnung nicht möglich!");
}

async function handle_BG_KTR_SZ(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): BillingTypeReturn {
  const isBG = await handle_BG_SZ(ctx, billingContext);

  if (isBG) {
    return isBG;
  }

  return await handle_KTR_SZ(ctx, billingContext);
}

async function handleVerlegung(
  ctx: PromptContext,
  billingContext: t.BillingContextTyp
): BillingTypeReturn {
  const isBG = await handle_BG_SZ(ctx, billingContext);

  if (isBG) {
    return isBG;
  }

  if (await ctx.prompts.verlegungInKrankenhausNiedrigerVersorungsstufe()) {
    return [getKrankenhausTarif(billingContext), t.BillingType.KHS];
  }

  return await handle_KTR_SZ(ctx, billingContext);
}

function getBerufsgenossenschaftTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KTR_BG,
    [t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_KTR_BG,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_KTR_BG,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_KTR_BG,
  }[billingContext];
}

function getSelbstzahlerTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_SZ,
    [t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_SZ,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_SZ,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_SZ,
  }[billingContext];
}

function getKrankenhausTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KHS,
    [t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_KHS,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_KHS,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_KHS,
  }[billingContext];
}

function getKrankenkasseTarif(billingContext: t.BillingContextTyp) {
  return {
    [t.BillingContextTyp.KTP]: t.BillingTariff.KTP_KTR_BG,
    [t.BillingContextTyp.KTP_Herabstufung]: t.BillingTariff.KTP_KTR_BG,
    [t.BillingContextTyp.NF]: t.BillingTariff.NF_KTR_BG,
    [t.BillingContextTyp.NA]: t.BillingTariff.NA_KTR_BG,
  }[billingContext];
}
