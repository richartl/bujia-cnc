(function () {
  function setText(id, text) {
    const element = document.getElementById(id);
    if (element) element.textContent = text;
  }

  function numberValue(id) {
    return Number(document.getElementById(id).value);
  }

  function textValue(id) {
    return document.getElementById(id).value;
  }

  function setValues(values) {
    Object.keys(values).forEach(function (id) {
      const element = document.getElementById(id);
      if (element) element.value = values[id];
    });
  }

  window.BujiaCommon = {
    setText: setText,
    numberValue: numberValue,
    textValue: textValue,
    setValues: setValues,
  };
}());
