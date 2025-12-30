type Option = { label: string; value: string };

export const timeOptions: Option[] = [];
for (let hour = 0; hour < 24; hour++) {
  for (let minute of ["00", "30"]) {
    const time = `${hour.toString().padStart(2, "0")}:${minute}`;
    timeOptions.push({ label: time, value: time });
  }
}