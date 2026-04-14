export function parseAndSaveData(content: string) {
  const regex = /\[DATA:(\w+)\]([\s\S]*?)\[\/DATA\]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const type = match[1];
    try {
      const data = JSON.parse(match[2]);
      switch (type) {
        case "blood": saveBloodwork(data); break;
        case "injection": saveInjection(data); break;
        case "supplements": saveSupplements(data); break;
        case "weight": saveWeight(data); break;
        case "checkin": saveCheckin(data); break;
      }
    } catch (e) {
      console.error("Data parse error:", e);
    }
  }
}

function saveBloodwork(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem("halflife-bloodwork") || "[]");
  existing.push({ ...data, date: new Date().toISOString() });
  localStorage.setItem("halflife-bloodwork", JSON.stringify(existing));
}

function saveInjection(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem("halflife-injections") || "[]");
  existing.push({ ...data, date: data.date === "today" ? new Date().toISOString() : data.date });
  localStorage.setItem("halflife-injections", JSON.stringify(existing));
}

function saveSupplements(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem("halflife-supplements-log") || "[]");
  existing.push({ ...data, date: new Date().toISOString() });
  localStorage.setItem("halflife-supplements-log", JSON.stringify(existing));
}

function saveWeight(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem("halflife-weights") || "[]");
  existing.push({ value: data.value, unit: data.unit || "kg", date: new Date().toISOString() });
  localStorage.setItem("halflife-weights", JSON.stringify(existing));
}

function saveCheckin(data: Record<string, unknown>) {
  const existing = JSON.parse(localStorage.getItem("halflife-checkins") || "[]");
  existing.push({ ...data, date: new Date().toISOString() });
  localStorage.setItem("halflife-checkins", JSON.stringify(existing));
}
