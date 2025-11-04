import * as t from "./prompts/types.js";

import { findBillingType } from "./billing.js";
import type { PromptContext } from "./prompts/context.js";

export async function startPrompt(ctx: PromptContext) {
  if ((await ctx.prompts.vorhaltung()) === t.ProvisionType.Sondereinsatz) {
    await ctx.messages.sondereinsätzeNichtVerpflegt();
    return await ctx.io.displayResult(t.TransportType.Sonstig);
  }

  switch (await ctx.prompts.szenario()) {
    case t.CallScenario.Rettungsfahrt:
      return await handleCallToTransport(ctx);
    case t.CallScenario.ArztZubringer:
      return await handleDoctorTransportToCallSite(ctx);
    case t.CallScenario.HuLaPlaÜbernahme:
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.KTP_Sonstige,
        await findBillingType(ctx, t.BillingContextTyp.KTP)
      );
    case t.CallScenario.Dienstfahrt:
      return await ctx.io.displayResult(t.TransportType.Dienstfahrt);
    case t.CallScenario.Werkstattfahrt:
      await ctx.messages.reparatMehrAlsEinTag();
      return await ctx.io.displayResult(t.TransportType.Werkstattfahrt);
    case t.CallScenario.Gebietsabsicherung:
      return await ctx.io.displayResult(t.TransportType.Gebietsabsicherung);
    default:
      return await ctx.io.displayError("Unbekanntes Szenario!");
  }
}

async function handleCallToTransport(ctx: PromptContext) {
  const transport = await ctx.prompts.wurdePatientTransportiert();

  if (!transport) {
    return handleNonTransport(ctx);
  }

  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

  if (
    doctorInvolvement &&
    (await ctx.prompts.abrechnungsfähigkeitNotarzt_Transport()) > 0
  ) {
    await ctx.messages.notarztNichtAbrechnungsfähig();

    return handleNonDoctorTransport(ctx);
  }

  if (doctorInvolvement && transport) {
    return handleTransportWithDoctorInvolvement(ctx);
  }

  const alarmType = await ctx.prompts.dispositionsSchlagwort();

  if (alarmType === t.AlarmReason.Verlegungsarzt) {
    return await ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      t.CallType.NA_Verlegung,
      await findBillingType(ctx, t.BillingContextTyp.NA)
    );
  }

  if (alarmType === t.AlarmReason.Notarzt) {
    await ctx.messages.disponierterNotarzteinsatzOhneNotarzt();
    ctx.setCached("dispositionsSchlagwort", t.AlarmReason.Notfall);
  }

  const perceptionAsEmergency = await ctx.prompts.wahrnehmungAlsNotfall();

  if (alarmType === t.AlarmReason.Krankentransport && !perceptionAsEmergency) {
    return handleKrankentransport(ctx);
  }

  const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

  if (
    ![
      t.VehicleKind.KTW,
      t.VehicleKind.RTW,
      t.VehicleKind.ITW,
      t.VehicleKind.Misc,
    ].includes(currentVehicle)
  ) {
    await ctx.messages.keinTransportmittel();
    ctx.flushCached("welchesEingesetzteFahrzeug");

    return handleCallToTransport(ctx);
  }

  const transportToHospital =
    await ctx.prompts.transportInBehandlungseinrichtung();

  if (
    alarmType === t.AlarmReason.Krankentransport &&
    perceptionAsEmergency &&
    currentVehicle === t.VehicleKind.KTW &&
    transportToHospital
  ) {
    ctx.messages.ktpNotfallHerabstufung();

    return ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      t.CallType.KTP_Notfall,
      await findBillingType(ctx, t.BillingContextTyp.KTP)
    );
  }

  if (
    alarmType > t.AlarmReason.Krankentransport &&
    transportToHospital &&
    !perceptionAsEmergency
  ) {
    await ctx.messages.disponierterNotfallNichtSoWahrgenommen();

    const downgradeReason = await ctx.prompts.herabstufungGrundKTP();

    const callType = {
      [t.EmergencyScenario_NF_Downgrade.ArbeitsOderWegeOderSchulUnfall]:
        t.CallType.KTP_BG_Unfall,
      [t.EmergencyScenario_NF_Downgrade.SonstigerUnfall]:
        t.CallType.KTP_Sonstiger_Unfall,
      [t.EmergencyScenario_NF_Downgrade.SonstigerEinsatz]:
        t.CallType.KTP_zum_KH,
    }[downgradeReason];

    return await ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      callType,
      await findBillingType(ctx, t.BillingContextTyp.KTP_Herabstufung)
    );
  }

  throw new Error("Unreachable!");
}

async function handleNonDoctorTransport(_ctx: PromptContext) {
  throw new Error("Notfalleinsatzabrechnung nicht implementiert");
}

async function handleKrankentransport(ctx: PromptContext) {
  return await ctx.io.displayResult(
    t.TransportType.Verrechenbar,
    t.CallType.KTP_zum_KH,
    await findBillingType(ctx, t.BillingContextTyp.KTP)
  );
}

async function handleNonTransport(ctx: PromptContext) {
  if (!(await ctx.prompts.wurdePatientAngetroffen())) {
    return await ctx.io.displayResult(t.TransportType.Leerfahrt);
  }

  if (await ctx.prompts.beiEintreffenSichereTodeszeichen()) {
    await ctx.messages.beiEintreffenSichereTodeszeichen();

    return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
  }

  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

  if (!doctorInvolvement) {
    return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
  }

  if (await ctx.prompts.abrechnungsfähigkeitNotarzt_KeinTransport()) {
    return ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
  }

  await ctx.messages.hinweiseNAV();

  switch (await ctx.prompts.notfallSzenarioMitNA()) {
    case t.EmergencyScenario_NA.Verkehrsunfall:
    case t.EmergencyScenario_NA.ArbeitsOderWegeUnfall:
    case t.EmergencyScenario_NA.Schulunfall:
    case t.EmergencyScenario_NA.SonstigerUnfall:
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.NA_kein_Transport_Unfall,
        await findBillingType(ctx, t.BillingContextTyp.NA)
      );
    case t.EmergencyScenario_NA.Internistisch:
    case t.EmergencyScenario_NA.SonstigerNofall:
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.NA_kein_Transport_Internistisch,
        await findBillingType(ctx, t.BillingContextTyp.NA)
      );
    case t.EmergencyScenario_NA.Verlegung:
      await ctx.messages.verlegungOhneTransportFehlermeldung();
  }
}

async function handleTransportWithDoctorInvolvement(ctx: PromptContext) {
  let callType = {
    [t.EmergencyScenario_NA.Verkehrsunfall]: t.CallType.NA_VU,
    [t.EmergencyScenario_NA.Verlegung]: t.CallType.NA_Verlegung,
    [t.EmergencyScenario_NA.ArbeitsOderWegeUnfall]: t.CallType.NA_Arbeitsunfall,
    [t.EmergencyScenario_NA.Schulunfall]: t.CallType.NA_Schulunfall,
    [t.EmergencyScenario_NA.Internistisch]: t.CallType.NA_Internistisch,
    [t.EmergencyScenario_NA.SonstigerUnfall]: t.CallType.NA_Sonstiger_Unfall,
    [t.EmergencyScenario_NA.SonstigerNofall]: t.CallType.NA_Sonstiger_Notfall,
  }[await ctx.prompts.notfallSzenarioMitNA()];

  if (callType === t.CallType.NA_Sonstiger_Notfall) {
    const isKhsTarif = await ctx.io.selectBool(
      "Wurde von einem Krankenhaus abtransportiert *und* gibt es einen triftigen Grund weshalb das Krankenhaus die Kosten für den Transport tragen muss?",
      "Beispiel: Keine zwingende Begründung für Transport mit Notarzt!"
    );

    if (isKhsTarif) {
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        callType,
        [t.BillingTariff.NA_KHS, t.BillingType.KHS]
      );
    }
  }

  return await ctx.io.displayResult(
    t.TransportType.Verrechenbar,
    callType,
    await findBillingType(ctx, t.BillingContextTyp.NA)
  );
}

async function handleDoctorTransportToCallSite(ctx: PromptContext) {
  const transport = await ctx.prompts.wurdePatientTransportiert();

  // Beispiel: NAW Transport...
  if (transport) {
    return handleCallToTransport(ctx);
  }

  const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();
  const alarmReason = await ctx.prompts.dispositionsSchlagwort();

  switch (currentVehicle) {
    case t.VehicleKind.KTW:
    case t.VehicleKind.RTW:
    case t.VehicleKind.Misc:
      return await ctx.io.displayResult(t.TransportType.NA_VA_Zubringer);
    case t.VehicleKind.NEF:
      return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
    case t.VehicleKind.VEF:
      switch (alarmReason) {
        case t.AlarmReason.Krankentransport:
        case t.AlarmReason.Notfall:
        case t.AlarmReason.Notarzt:
          return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
        case t.AlarmReason.Verlegungsarzt:
          return await ctx.io.displayResult(t.TransportType.VEF_Einsatz);
      }
  }
}
