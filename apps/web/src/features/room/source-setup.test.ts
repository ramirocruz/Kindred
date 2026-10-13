import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SourceSetup } from "./components/SourceSetup";
import { ExtensionSetup } from './components/ExtensionSetup';

describe("source setup parity", () => {
  it('keeps extension downloads inside the GitHub Pages project path', () => {
    for (const gdrive of [true, false]) {
      const html = renderToStaticMarkup(createElement(ExtensionSetup, { gdrive, baseUrl: '/Kindred/', onClose: () => {} }));
      expect(html).toContain('href="/Kindred/downloads/');
      expect(html).not.toContain('href="/downloads/');
    }
  });
  it("renders a URL field without implying connected playback", () => {
    const html = renderToStaticMarkup(createElement(SourceSetup, { source: "YouTube", onClose: () => {} }));
    expect(html).toContain('type="url"');
    expect(html).toContain("Playback and sharing are not connected");
    expect(html).toContain('disabled=""');
  });
  it("renders the personal file chooser with supported container hints", () => {
    const html = renderToStaticMarkup(createElement(SourceSetup, { source: "Personal file", onClose: () => {} }));
    expect(html).toContain('type="file"');
    expect(html).toContain(".mp4,.mkv,.webm");
    expect(html).toContain("Nothing selected here is uploaded or sent");
  });
});
