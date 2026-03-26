export const waitForCondition = (condition: () => boolean, interval = 100) => {
  return new Promise((resolve) => {
    const check = setInterval(() => {
      if (condition()) {
        clearInterval(check);
        resolve(true);
      }
    }, interval);
  });
};
