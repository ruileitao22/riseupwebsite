export function renderPasswordRecoveryEmail(code: string) {
  const subject = "Código para repor a palavra-passe | Rise Up";
  const instructions = "Introduz este código no backoffice para definires uma nova palavra-passe.";
  const expiry = "O código é válido durante 10 minutos e só pode ser utilizado uma vez.";
  const footer = "Se não pediste a reposição da palavra-passe, podes ignorar este email.";

  return {
    subject,
    text: `Rise Up · Backoffice\n\nRepõe a tua palavra-passe\n\n${instructions}\n\n${code}\n\n${expiry}\n\n${footer}`,
    html: `<!doctype html>
<html lang="pt-PT">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${subject}</title></head>
<body style="margin:0;background:#f2f6fa;color:#17242d;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f2f6fa">
    <tr><td align="center" style="padding:32px 12px">
      <table role="presentation" width="520" cellspacing="0" cellpadding="0" style="width:100%;max-width:520px;background:#fff;border:1px solid #dce6ef;border-radius:16px">
        <tr><td style="padding:28px 28px 22px;border-bottom:3px solid #176ed6">
          <img src="https://riseupmaia.pt/img/riseup-logo.png" width="128" alt="Rise Up" style="display:block;width:128px;height:auto;border:0;color:#17242d;font-weight:bold">
        </td></tr>
        <tr><td style="padding:28px 28px 30px">
          <p style="margin:0 0 10px;color:#165ead;font-size:13px;line-height:1.4;font-weight:bold">Backoffice</p>
          <h1 style="margin:0 0 12px;font-size:27px;line-height:1.2">Repõe a tua palavra-passe</h1>
          <p style="margin:0 0 20px;color:#445664;font-size:16px;line-height:1.6">${instructions}</p>
          <div style="padding:16px 12px;background:#edf5ff;border:1px solid #cfe3fa;border-radius:10px;color:#153e68;font-family:Consolas,monospace;font-size:31px;line-height:1.4;font-weight:bold;letter-spacing:6px;text-align:center">${code}</div>
          <p style="margin:14px 0 0;color:#445664;font-size:14px;line-height:1.6">${expiry}</p>
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #dce6ef;color:#445664;font-size:13px;line-height:1.6">${footer}</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
  };
}
