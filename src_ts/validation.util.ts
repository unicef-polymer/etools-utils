export function fieldsAreValid(shadowRoow: any, elementClass?: string) {
  let valid = true;
  const fields = shadowRoow!.querySelectorAll(elementClass ? elementClass : '.validate');

  fields.forEach((field: any) => {
    field.validate();
  });

  fields.forEach((field: any) => {
    if (field.invalid) {
      valid = false;
    }
  });
  return valid;
}

export function dateRangeValid(shadowRoow: any, start: string, end: string) {
  const startField = shadowRoow!.querySelector(start);
  const endField = shadowRoow!.querySelector(end);
  if (!startField || !endField) {
    return true;
  }
  const startValue = startField.value;
  const endValue = endField.value;

  if (!Date.parse(startValue) || !Date.parse(endValue)) {
    if (startField.required) {
      startField.invalid = true;
    }

    if (endField.required) {
      endField.invalid = true;
    }

    return false;
  }

  if (new Date(startField.value) >= new Date(endField.value)) {
    startField.invalid = true;
    endField.invalid = true;

    return false;
  }

  startField.invalid = false;
  endField.invalid = false;

  return true;
}
