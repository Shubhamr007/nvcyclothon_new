function toRegistrationRead(registration) {
  return {
    id: registration.id,
    full_name: registration.full_name,
    ride_category: registration.ride_category,
    status: registration.status,
    created_at: registration.created_at,
    payment_status: registration.payment_status,
    payment_order_id: registration.payment_order_id,
    payment_id: registration.payment_id,
    payment_bank_reference: registration.payment_bank_reference,
    payment_method: registration.payment_method,
    cashfree_payment_time: registration.cashfree_payment_time,
    payment_verified_at: registration.payment_verified_at,
    whatsapp_use_primary: registration.whatsapp_use_primary,
    preferred_whatsapp_number: registration.preferred_whatsapp_number,
    whatsapp_opt_in: registration.whatsapp_opt_in,
  };
}

async function sendAndRecordRegistrationConfirmation({
  repository,
  emailService,
  config,
  registration,
}) {
  const settings = await repository.getSiteSettings();
  const sent = await emailService.sendRegistrationConfirmation({
    recipient: registration.email,
    registration,
    checkinQrPrefix: config.checkinQrPrefix,
    eventDate: settings.event_date,
    eventLocation: settings.event_location,
    eventStartTime: settings.event_start_time,
  });
  await repository.recordEmailDelivery({
    registrationId: registration.id,
    emailType: "registration_confirmation",
    recipient: registration.email,
    subject: "Your NV Cyclothon 2026 registration is confirmed",
    sent,
    status: config.emailEnabled ? (sent ? "sent" : "failed") : "disabled",
  });
}

module.exports = {
  toRegistrationRead,
  sendAndRecordRegistrationConfirmation,
};
