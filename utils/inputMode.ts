export const handleIntegerChange = (
  value: string,
  setter: (val: string) => void
) => {
  if (value === "" || /^\d*$/.test(value)) {
    setter(value);
  }
};

export const handleDecimalChange = (
  value: string,
  setter: (val: string) => void
) => {
  const regex = /^\d*\.?\d*$/;
  if (regex.test(value)) {
    setter(value);
  }
};

export const handleNumericChange = (
  value: string,
  setter: (val: string) => void
) => {
  const regex = /^\d*\.?\d*$/;
  if (regex.test(value)) {
    setter(value);
  }
};
