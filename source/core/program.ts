import * as t from "./prompts/types.js";

import type { PromptContext } from "./prompts/context.js";

export async function startPrompt(ctx: PromptContext) {
  if ((await ctx.prompts.vorhaltung()) === t.ProvisionType.Sondereinsatz) {
    await ctx.io.message(
      t.MessageType.Alert,
      "In diesem Tool sind Sondereinsätze aktuell nicht verpflegt."
    );

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
      await ctx.io.message(
        t.MessageType.Warning,
        "Dauert die Reparatur länger als einen Tag, muss für die Rückfahrt eine zweite Fahrt mit Nummer gebucht werden."
      );

      return await ctx.io.displayResult(t.TransportType.Werkstattfahrt);
    case t.CallScenario.Gebietsabsicherung:
      return await ctx.io.displayResult(t.TransportType.Gebietsabsicherung);
    default:
      return await ctx.io.displayError("Unbekanntes Szenario!");
  }
}

async function handleCallToTransport(ctx: PromptContext) {
  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();
  const transport = await ctx.prompts.wurdePatientTransportiert();

  if (!transport) {
    return handleNonTransport(ctx);
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
    await ctx.io.message(
      t.MessageType.Warning,
      "Ein disponierter Notarzteinsatz, welcher ohne Notarztbeteiligung abgearbeitet wurde, muss als Notfalleinsatz abgerechnet werden!"
    );

    ctx.setCached("dispositionsSchlagwort", t.AlarmReason.Notfall);
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
    await ctx.io.message(
      t.MessageType.Error,
      "Abrechnung unmöglich! Ihr gewähltes Fahrzeug ist kein zugelassenes Transportmittel und kann somit keinen Transport abrechnen! Wählen sie ein anderes Einsatzmittel"
    );

    ctx.flushCached("welchesEingesetzteFahrzeug");

    return handleCallToTransport(ctx);
  }

  const perceptionAsEmergency = await ctx.prompts.wahrnehmungAlsNotfall();

  if (
    alarmType === t.AlarmReason.Krankentransport &&
    perceptionAsEmergency &&
    currentVehicle === t.VehicleKind.KTW
  ) {
    // TODO: Explizite Frage: RTW verfügbar?
    return ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      t.CallType.KTP_Notfall,
      await findBillingType(ctx, t.BillingContextTyp.KTP)
    );
  }

  if (alarmType > t.AlarmReason.Krankentransport && !perceptionAsEmergency) {
    // TODO: Abrechnung KTP
    throw new Error("Not implemented yet");
  }
}

async function isPrivatOrUnknownInsurance(ctx: PromptContext) {
  return (
    (await ctx.prompts.istPrivateKrankenkasse()) ||
    !(await ctx.prompts.istKrankenkasseBekannt())
  );
}

async function findBillingType(
  ctx: PromptContext,
  billingContextType: t.BillingContextTyp
): Promise<[number, t.BillingType] | null> {
  switch (billingContextType) {
    case t.BillingContextTyp.KTP:
      if ((await ctx.prompts.szenario()) === t.CallScenario.HuLaPlaÜbernahme) {
        if (await ctx.prompts.istUrsacheBerufskrankheit()) {
          if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
            return [t.BillingTariff.KTP_BG_KTR, t.BillingType.BG];
          }

          return [t.BillingTariff.KTP_SZ, t.BillingType.SZ];
        }

        if (
          await ctx.prompts.verlegungInKrankenhausNiedrigerVersorungsstufe()
        ) {
          return [t.BillingTariff.KTP_KHS, t.BillingType.KHS];
        }

        if (await isPrivatOrUnknownInsurance(ctx)) {
          return [t.BillingTariff.KTP_SZ, t.BillingType.SZ];
        }

        return [t.BillingTariff.KTP_BG_KTR, t.BillingType.KTR];
      }

      return null;
    case t.BillingContextTyp.NF:
      return null;
    case t.BillingContextTyp.NA:
      if (!(await ctx.prompts.wurdePatientTransportiert())) {
        switch (await ctx.prompts.notfallSzenarioMitNA()) {
          case t.EmergencyScenario.Schulunfall:
          case t.EmergencyScenario.ArbeitsOderWegeUnfall:
            if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
              return [t.BillingTariff.NA_KTR_BG, t.BillingType.BG];
            }

            await ctx.io.message(
              t.MessageType.Info,
              "Ist die zuständige Berufsgenossenschaft nicht bekannt muss eine Privatrechnung ausgestellt werden. Der Arbeitnehmer (bzw. Schüler) kann diese dann einreichen, sobald der Träger geklärt wurde."
            );

            return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
          case t.EmergencyScenario.Verlegung:
          case t.EmergencyScenario.SonstigerNofall:
            if (!(await ctx.prompts.istUrsacheBerufskrankheit())) {
              break;
            }

            if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
              return [t.BillingTariff.NA_KTR_BG, t.BillingType.BG];
            }

            return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
        }

        if (await isPrivatOrUnknownInsurance(ctx)) {
          return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
        }

        return [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
      }

      switch (await ctx.prompts.notfallSzenarioMitNA()) {
        case t.EmergencyScenario.ArbeitsOderWegeUnfall:
        case t.EmergencyScenario.Schulunfall:
          await ctx.io.message(
            t.MessageType.Info,
            "Name und Anschrift des Arbeitgeber (bzw. Schule) in ZAST-Info Feld oder auf Transportschein notieren!"
          );

          if (await ctx.prompts.istBerufsgenossenschaftBekannt()) {
            return [t.BillingTariff.NA_KTR_BG, t.BillingType.BG];
          }

          return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
        case t.EmergencyScenario.Internistisch:
        case t.EmergencyScenario.Verkehrsunfall:
        case t.EmergencyScenario.SonstigerUnfall:
          return (await isPrivatOrUnknownInsurance(ctx))
            ? [t.BillingTariff.NA_SZ, t.BillingType.SZ]
            : [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
        case t.EmergencyScenario.Verlegung:
          if (
            await ctx.prompts.verlegungInKrankenhausNiedrigerVersorungsstufe()
          ) {
            return [t.BillingTariff.NA_KHS, t.BillingType.KHS];
          }

          if (await isPrivatOrUnknownInsurance(ctx)) {
            return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
          }

          return [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
        case t.EmergencyScenario.SonstigerNofall:
          if (await isPrivatOrUnknownInsurance(ctx)) {
            return [t.BillingTariff.NA_SZ, t.BillingType.SZ];
          }

          return [t.BillingTariff.NA_KTR_BG, t.BillingType.KTR];
      }
  }
}

async function handleNonTransport(ctx: PromptContext) {
  if (!(await ctx.prompts.wurdePatientAngetroffen())) {
    return await ctx.io.displayResult(t.TransportType.Leerfahrt);
  }

  if (await ctx.prompts.beiEintreffenSichereTodeszeichen()) {
    await ctx.io.message(
      t.MessageType.Info,
      "Liegen beim Eintreffen des Rettungsdienstes sichere Todeszeichen vor, ist keine Abrechnung durch den Rettungsdienst möglich!"
    );

    return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
  }

  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

  if (!doctorInvolvement) {
    return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
  }

  await ctx.io.message(
    t.MessageType.Info,
    `
**Zu beachten:**
1. Als Transportweg ist von \"Notarztversorgung\" nach \"Patienten- oder Behandlungsadresse\" anzugeben
2. Zusätzlich am gleichen Einsatz versorgte Patienten können nur abgerechnet werden, wenn im Regelfall eine erneute Notarztalarmierung über die ILS erfolgt wäre
3. Bei einem MANV ist Abrechnungen im Einzelfall mit ZAST GmbH klären!`
  );

  switch (await ctx.prompts.notfallSzenarioMitNA()) {
    case t.EmergencyScenario.Verkehrsunfall:
    case t.EmergencyScenario.ArbeitsOderWegeUnfall:
    case t.EmergencyScenario.Schulunfall:
    case t.EmergencyScenario.SonstigerUnfall:
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.NA_kein_Transport_Unfall,
        await findBillingType(ctx, t.BillingContextTyp.NA)
      );
    case t.EmergencyScenario.Internistisch:
    case t.EmergencyScenario.SonstigerNofall:
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.NA_kein_Transport_Internistisch,
        await findBillingType(ctx, t.BillingContextTyp.NA)
      );
    case t.EmergencyScenario.Verlegung:
      await ctx.io.message(
        t.MessageType.Error,
        "**Fehler:** Eine Verlegung ohne Transport ist nicht möglich... Dieses Einsatzszenario ist so nicht möglich."
      );
  }
}

async function handleTransportWithDoctorInvolvement(ctx: PromptContext) {
  let callType = {
    [t.EmergencyScenario.Verkehrsunfall]: t.CallType.NA_VU,
    [t.EmergencyScenario.Verlegung]: t.CallType.NA_Verlegung,
    [t.EmergencyScenario.ArbeitsOderWegeUnfall]: t.CallType.NA_Arbeitsunfall,
    [t.EmergencyScenario.Schulunfall]: t.CallType.NA_Schulunfall,
    [t.EmergencyScenario.Internistisch]: t.CallType.NA_Internistisch,
    [t.EmergencyScenario.SonstigerUnfall]: t.CallType.NA_Sonstiger_Unfall,
    [t.EmergencyScenario.SonstigerNofall]: t.CallType.NA_Sonstiger_Notfall,
  }[await ctx.prompts.notfallSzenarioMitNA()];

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

  const callUpgradeMessage =
    "Sobald ein durch die Leitstelle alarmierter Arzt an einem Einsatz teilnimmt, wird dieser Einsatz automatisch zum Notarzteinsatz, auch wenn die initiale Alarmierung anders war.";

  switch (currentVehicle) {
    case t.VehicleKind.KTW:
    case t.VehicleKind.RTW:
    case t.VehicleKind.Misc:
      switch (alarmReason) {
        case t.AlarmReason.Krankentransport:
        case t.AlarmReason.Notfall:
          await ctx.io.message(t.MessageType.Warning, callUpgradeMessage);
        case t.AlarmReason.Notarzt:
        case t.AlarmReason.Verlegungsarzt:
          return await ctx.io.displayResult(t.TransportType.VEF_Einsatz);
      }
    case t.VehicleKind.NEF:
      switch (alarmReason) {
        case t.AlarmReason.Krankentransport:
        case t.AlarmReason.Notfall:
          await ctx.io.message(t.MessageType.Warning, callUpgradeMessage);
        case t.AlarmReason.Notarzt:
          return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
        case t.AlarmReason.Verlegungsarzt:
          await ctx.io.message(
            t.MessageType.Alert,
            "Eine Alarmierung eines NEF zu einer VEF-Verlegung ist nicht möglich. Im Zweifel als Notarztverlegung abrechnen!"
          );

          return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
      }
    case t.VehicleKind.VEF:
      switch (alarmReason) {
        case t.AlarmReason.Krankentransport:
        case t.AlarmReason.Notfall:
        case t.AlarmReason.Notarzt:
          await ctx.io.message(t.MessageType.Warning, callUpgradeMessage);

          return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
        case t.AlarmReason.Verlegungsarzt:
          return await ctx.io.displayResult(t.TransportType.VEF_Einsatz);
      }
  }
}
