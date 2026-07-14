(function () {
  function ensureFileExtension(fileName, fallbackName, allowedExtensions, defaultExtension) {
    const cleanName = (fileName || "").trim() || fallbackName;
    const pattern = new RegExp("\\.(" + allowedExtensions.join("|") + ")$", "i");
    return pattern.test(cleanName) ? cleanName : cleanName + "." + defaultExtension;
  }

  function downloadText(content, fileName) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  window.BujiaDownload = {
    ensureFileExtension: ensureFileExtension,
    downloadText: downloadText,
  };
}());
