export const callClickOnSpacePushListener = (htmlElement: any) => {
  if (htmlElement && htmlElement.addEventListener) {
    htmlElement.addEventListener('keyup', function (event: KeyboardEvent) {
      if (event.key === ' ' && !event.ctrlKey) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        htmlElement.click();
      }
    });
  }
};

export const callClickOnEnterPushListener = (htmlElement: any) => {
  if (htmlElement && htmlElement.addEventListener) {
    htmlElement.addEventListener('keyup', function (event: KeyboardEvent) {
      if (event.key === 'Enter' && !event.ctrlKey) {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        htmlElement.click();
      }
    });
  }
};
