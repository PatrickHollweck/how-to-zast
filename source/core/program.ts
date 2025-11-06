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

  if (!(await isValidVehicleCallTypeCombinationsForTransport(ctx))) {
    return;
  }

  if (
    (await ctx.prompts.wurdePatientTransportiert()) &&
    (await ctx.prompts.transportUrsprungOderZielHuLaPla())
  ) {
    return await ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      t.CallType.KTP_Sonstige,
      await findBillingType(ctx, t.BillingContextTyp.KTP)
    );
  }

  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

  if (
    doctorInvolvement &&
    (await ctx.prompts.abrechnungsfähigkeitNotarzt_Transport()) !==
      t.DoctorNotBillableReason.KeinGrund
  ) {
    return await handleNonTransport_DoctorNotBillable(ctx);
  }

  if (doctorInvolvement && transport) {
    return await handleTransportWithDoctorInvolvement(ctx);
  }

  const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();
  const alarmType = await ctx.prompts.dispositionsSchlagwort();
  const perceptionAsEmergency = await ctx.prompts.wahrnehmungAlsNotfall();

  if (alarmType === t.AlarmReason.Krankentransport && !perceptionAsEmergency) {
    return await handleKrankentransport(ctx);
  }

  if (currentVehicle === t.VehicleKind.KTW && perceptionAsEmergency) {
    await ctx.messages.ktpNotfallHerabstufung();

    return ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      t.CallType.KTP_Notfall,
      await findBillingType(ctx, t.BillingContextTyp.KTP)
    );
  }

  if (alarmType > t.AlarmReason.Krankentransport && !perceptionAsEmergency) {
    return await handleKtpDowngrade(ctx);
  }

  if (currentVehicle === t.VehicleKind.RTW) {
    return handleTransportWithoutDoctorInvolvementRTW(ctx);
  }
}

async function handleNonTransport_DoctorNotBillable(ctx: PromptContext) {
  const doctorNotBillableReason =
    await ctx.prompts.abrechnungsfähigkeitNotarzt_Transport();

  switch (doctorNotBillableReason) {
    case t.DoctorNotBillableReason.KeinGrund:
      break;
    case t.DoctorNotBillableReason.KeineLeistung:
    case t.DoctorNotBillableReason.NichtImDienst:
    case t.DoctorNotBillableReason.MehrerePatienten:
      await ctx.messages.notarztNichtAbrechnungsfähig();
      ctx.setCached("warNotarztBeteiligt", false);

      return await handleTransportWithoutDoctorInvolvementRTW(ctx);
    case t.DoctorNotBillableReason.NichtAusBayern:
      await ctx.messages.hinweisNotarztHerkunftAngeben();

      return await handleNonTransport_NF(
        ctx,
        await ctx.prompts.wurdePatientTransportiert()
      );
    case t.DoctorNotBillableReason.Luftrettungsmittel:
      return await handleAirTransport(ctx);
    case t.DoctorNotBillableReason.NAW_ITW:
      const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

      switch (currentVehicle) {
        case t.VehicleKind.KTW:
        case t.VehicleKind.RTW:
          await ctx.messages.transportBeiVersorgungDurchNAW();

          return await ctx.io.displayResult(
            t.TransportType.Verrechenbar,
            t.CallType.KTP_zum_KH,
            await findBillingType(ctx, t.BillingContextTyp.KTP_Herabstufung)
          );
        case t.VehicleKind.NEF:
        case t.VehicleKind.VEF:
          return await ctx.messages.keinTransportmittel();
        case t.VehicleKind.NAW:
          return await ctx.messages.nawOhneArzt();
        case t.VehicleKind.ITW:
          await ctx.messages.notarztNichtAbrechnungsfähig();
          ctx.setCached("warNotarztBeteiligt", false);

          return await handleTransportWithoutDoctorInvolvementRTW(ctx);
      }
  }
}

async function handleKtpDowngrade(ctx: PromptContext) {
  await ctx.messages.disponierterNotfallNichtSoWahrgenommen();

  const downgradeReason = await ctx.prompts.herabstufungGrundKTP();

  const callType = {
    [t.EmergencyScenario_NF_Downgrade.ArbeitsOderWegeOderSchulUnfall]:
      t.CallType.KTP_BG_Unfall,
    [t.EmergencyScenario_NF_Downgrade.SonstigerUnfall]:
      t.CallType.KTP_Sonstiger_Unfall,
    [t.EmergencyScenario_NF_Downgrade.SonstigerEinsatz]: t.CallType.KTP_zum_KH,
    [t.EmergencyScenario_NF_Downgrade.Holdienst]: t.CallType.KTP_Verlegung,
    [t.EmergencyScenario_NF_Downgrade.Verlegung]: t.CallType.KTP_Verlegung,
  }[downgradeReason];

  return await ctx.io.displayResult(
    t.TransportType.Verrechenbar,
    callType,
    await findBillingType(ctx, t.BillingContextTyp.KTP_Herabstufung)
  );
}

async function handleTransportWithoutDoctorInvolvementRTW(ctx: PromptContext) {
  const callScenario = await ctx.prompts.notfallSzenarioOhneNA();

  if (callScenario === t.EmergencyScenario_NF.NeugeborenenHoldienst) {
    if (await ctx.prompts.holdienstBegleitungDurchKlinik()) {
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.NF_Neugeborenen_Holdienst,
        await findBillingType(ctx, t.BillingContextTyp.NF)
      );
    }

    if (await ctx.prompts.wahrnehmungAlsNotfall()) {
      ctx.setCached("notfallSzenarioOhneNA", t.EmergencyScenario_NF.Verlegung);

      return await handleTransportWithoutDoctorInvolvementRTW(ctx);
    } else {
      ctx.setCached(
        "herabstufungGrundKTP",
        t.EmergencyScenario_NF_Downgrade.Holdienst
      );

      return await handleKtpDowngrade(ctx);
    }
  }

  if (callScenario === t.EmergencyScenario_NF.Verlegung) {
    const isKvbTransfer = await ctx.prompts.verlegungBegleitungKVB();

    return await ctx.io.displayResult(
      t.TransportType.Verrechenbar,
      isKvbTransfer ? t.CallType.NF_Verlegung_KVB : t.CallType.NF_Verlegung,
      await findBillingType(
        ctx,
        isKvbTransfer
          ? t.BillingContextTyp.NF_KVB_Verlegungsarzt
          : t.BillingContextTyp.NF
      )
    );
  }

  let callType = {
    [t.EmergencyScenario_NF.Verkehrsunfall]: t.CallType.NF_VU,
    [t.EmergencyScenario_NF.Verlegung]: t.CallType.NF_Verlegung,
    [t.EmergencyScenario_NF.ArbeitsOderWegeUnfall]: t.CallType.NF_Arbeitsunfall,
    [t.EmergencyScenario_NF.Schulunfall]: t.CallType.NF_Schulunfall,
    [t.EmergencyScenario_NF.Internistisch]: t.CallType.NF_Internistisch,
    [t.EmergencyScenario_NF.SonstigerUnfall]: t.CallType.NF_Sonstiger_Unfall,
    [t.EmergencyScenario_NF.SonstigerNofall]: t.CallType.NF_Sonstiger_Nofall,
  }[callScenario];

  return ctx.io.displayResult(
    t.TransportType.Verrechenbar,
    callType,
    await findBillingType(ctx, t.BillingContextTyp.NF)
  );
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

  const transferToOtherVehicleType =
    await ctx.prompts.anderesFahrzeugTransportiert();

  if (transferToOtherVehicleType) {
    if (transferToOtherVehicleType === t.TransferType.Luftgebunden) {
      return await handleAirTransport(ctx);
    }

    switch (await ctx.prompts.welchesEingesetzteFahrzeug()) {
      case t.VehicleKind.KTW:
      case t.VehicleKind.RTW:
      case t.VehicleKind.NEF:
      case t.VehicleKind.VEF:
        return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
      case t.VehicleKind.NAW:
      case t.VehicleKind.ITW:
        ctx.setCached(
          "abrechnungsfähigkeitNotarzt_Transport",
          t.DoctorNotBillableReason.KeinGrund
        );

        ctx.setCached(
          "abrechnungsfähigkeitNotarzt_KeinTransport",
          t.DoctorNotBillableReason.KeinGrund
        );

        ctx.setCached("warNotarztBeteiligt", true);
    }
  }

  const doctorInvolvement = await ctx.prompts.warNotarztBeteiligt();

  if (!doctorInvolvement) {
    return await ctx.io.displayResult(t.TransportType.NichtVerrechenbar);
  }

  const doctorNotBillableReason =
    await ctx.prompts.abrechnungsfähigkeitNotarzt_KeinTransport();

  switch (doctorNotBillableReason) {
    case t.DoctorNotBillableReason.KeinGrund:
      break;
    case t.DoctorNotBillableReason.NichtAusBayern:
    case t.DoctorNotBillableReason.Luftrettungsmittel:
      ctx.setCached(
        "abrechnungsfähigkeitNotarzt_Transport",
        doctorNotBillableReason
      );

      return await handleNonTransport_DoctorNotBillable(ctx);
    case t.DoctorNotBillableReason.NAW_ITW:
    case t.DoctorNotBillableReason.NichtImDienst:
    case t.DoctorNotBillableReason.KeineLeistung:
    case t.DoctorNotBillableReason.MehrerePatienten:
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

  throw new Error("Unreachable!");
}

async function handleAirTransport(ctx: PromptContext): Promise<any> {
  const groundDoctorInvolved = await ctx.prompts.bodengebundenerNotarzt();
  const transportType = await ctx.prompts.transportBeiHeliBeteiligung();

  ctx.setCached(
    "abrechnungsfähigkeitNotarzt_KeinTransport",
    t.DoctorNotBillableReason.KeinGrund
  );

  ctx.setCached(
    "abrechnungsfähigkeitNotarzt_Transport",
    t.DoctorNotBillableReason.KeinGrund
  );

  if (!(await isValidVehicleCallTypeCombinationsForTransport(ctx))) {
    return;
  }

  if (groundDoctorInvolved) {
    await ctx.messages.hinweisBodengebundenenNotarztAngeben();

    ctx.setCached("warNotarztBeteiligt", true);

    switch (transportType) {
      case t.HeliTransportType.KeinTransport:
        ctx.setCached("anderesFahrzeugTransportiert", t.TransferType.Keine);
        return await handleNonTransport(ctx);
      case t.HeliTransportType.Bodengebunden:
        ctx.setCached("anderesFahrzeugTransportiert", t.TransferType.Keine);
        return await handleCallToTransport(ctx);
      case t.HeliTransportType.Luftgebunden:
        ctx.setCached("wahrnehmungAlsNotfall", true);
        ctx.setCached("wurdePatientTransportiert", true);
        ctx.setCached("dispositionsSchlagwort", t.AlarmReason.Notarzt);

        return await handleCallToTransport(ctx);
      default:
        throw new Error("Unbekannter Transport-Typ!");
    }
  }

  ctx.setCached("warNotarztBeteiligt", false);
  ctx.setCached("anderesFahrzeugTransportiert", t.TransferType.Keine);
  await ctx.messages.hinweisLuftrettungsmittelNotarztAngeben();

  switch (transportType) {
    case t.HeliTransportType.Bodengebunden:
      ctx.setCached("wahrnehmungAlsNotfall", true);
      ctx.setCached("wurdePatientTransportiert", true);

      return await handleCallToTransport(ctx);
    case t.HeliTransportType.KeinTransport:
      if (await ctx.prompts.abrechnungsfähigkeitNotarzt_NurRdAusreichend()) {
        return await handleNonTransport(ctx);
      }

    // -- fallthrough..
    case t.HeliTransportType.Luftgebunden:
      return await handleNonTransport_NF(ctx);
    default:
      throw new Error("Unbekannter Transport-Typ!");
  }
}

async function handleNonTransport_NF(
  ctx: PromptContext,
  patientTransported: boolean = true
) {
  switch (await ctx.prompts.notfallSzenarioOhneNA()) {
    case t.EmergencyScenario_NF.Schulunfall:
    case t.EmergencyScenario_NF.Verkehrsunfall:
    case t.EmergencyScenario_NF.SonstigerUnfall:
    case t.EmergencyScenario_NF.ArbeitsOderWegeUnfall:
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.NF_kein_Transport_Unfall,
        await findBillingType(ctx, t.BillingContextTyp.NF)
      );

    case t.EmergencyScenario_NF.Verlegung:
    case t.EmergencyScenario_NF.NeugeborenenHoldienst:
      if (!patientTransported) {
        return await ctx.messages.verlegungOhneTransportFehlermeldung();
      }

    case t.EmergencyScenario_NF.Internistisch:
    case t.EmergencyScenario_NF.SonstigerNofall:
      return await ctx.io.displayResult(
        t.TransportType.Verrechenbar,
        t.CallType.NF_kein_Transport_SonstNotfall,
        await findBillingType(ctx, t.BillingContextTyp.NF)
      );

    default:
      throw new Error("Unbekannter Notfall-Typ!");
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
    const isKhsTarif = await ctx.prompts.sonstigerNotfallKrankenhausTräger();

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
  const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();

  switch (currentVehicle) {
    case t.VehicleKind.KTW:
    case t.VehicleKind.RTW:
      return await ctx.io.displayResult(t.TransportType.NA_VA_Zubringer);
    case t.VehicleKind.NEF:
      return await ctx.io.displayResult(t.TransportType.NEF_Einsatz);
    case t.VehicleKind.VEF:
      return await ctx.io.displayResult(t.TransportType.VEF_Einsatz);
    case t.VehicleKind.ITW:
    case t.VehicleKind.NAW:
      return handleNonTransport(ctx);
  }
}
async function isValidVehicleCallTypeCombinationsForTransport(
  ctx: PromptContext
): Promise<boolean> {
  const currentVehicle = await ctx.prompts.welchesEingesetzteFahrzeug();
  const alarmType = await ctx.prompts.dispositionsSchlagwort();

  switch (alarmType) {
    case t.AlarmReason.Krankentransport:
    case t.AlarmReason.Notfall:
    case t.AlarmReason.Notarzt:
      if ([t.VehicleKind.NEF, t.VehicleKind.VEF].includes(currentVehicle)) {
        await ctx.messages.keinTransportmittel();
        await handleDoctorTransportToCallSite(ctx);

        return false;
      }

      break;
    case t.AlarmReason.Verlegungsarzt:
      if ([t.VehicleKind.NAW, t.VehicleKind.NEF].includes(currentVehicle)) {
        await ctx.messages.dispositionNotarztZuVefVerlegung();

        return false;
      }

      break;
    case t.AlarmReason.ITW:
      if (currentVehicle !== t.VehicleKind.ITW) {
        await ctx.messages.dispositionVonNichtITWZuITWEinsatz();

        return false;
      }
  }

  switch (currentVehicle) {
    case t.VehicleKind.KTW:
    case t.VehicleKind.RTW:
      if (alarmType === t.AlarmReason.Verlegungsarzt) {
        await ctx.io.displayResult(
          t.TransportType.Verrechenbar,
          t.CallType.NA_Verlegung,
          await findBillingType(ctx, t.BillingContextTyp.NA)
        );

        return false;
      }

      if (
        alarmType === t.AlarmReason.Notarzt &&
        !(await ctx.prompts.warNotarztBeteiligt())
      ) {
        await ctx.messages.disponierterNotarzteinsatzOhneNotarzt();
        ctx.setCached("dispositionsSchlagwort", t.AlarmReason.Notfall);

        await handleCallToTransport(ctx);

        return false;
      }

      break;

    case t.VehicleKind.ITW:
      if (alarmType === t.AlarmReason.ITW) {
        await ctx.io.displayResult(
          t.TransportType.Verrechenbar,
          t.CallType.NF_ITW,
          await findBillingType(ctx, t.BillingContextTyp.NF)
        );

        return false;
      }

    // -- fallthrough...
    case t.VehicleKind.NAW:
      ctx.setCached("warNotarztBeteiligt", true);

      ctx.setCached(
        "abrechnungsfähigkeitNotarzt_Transport",
        t.DoctorNotBillableReason.KeinGrund
      );

      break;
    case t.VehicleKind.NEF:
    case t.VehicleKind.VEF:
      await ctx.messages.keinTransportmittel();
      await handleDoctorTransportToCallSite(ctx);

      return false;
  }

  return true;
}
