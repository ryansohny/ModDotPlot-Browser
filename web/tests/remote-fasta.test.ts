import { describe, expect, it, vi } from "vitest";
import { parseRemoteFastaUrl, parseRemoteTrackUrl } from "../src/remote-fasta";

describe("remote FASTA URLs", () => {
  it("normalizes the Col-CEN gzip URL used by the landing page workflow", () => {
    expect(parseRemoteFastaUrl(
      "  https://github.com/schatzlab/Col-CEN/raw/main/v1.2/Col-CEN_v1.2.fasta.gz  ",
    )).toEqual({
      url: "https://raw.githubusercontent.com/schatzlab/Col-CEN/main/v1.2/Col-CEN_v1.2.fasta.gz",
      fileName: "Col-CEN_v1.2.fasta.gz",
    });
  });

  it.each(["assembly.fa", "assembly.fasta", "assembly.fna", "assembly.fas.gz"])(
    "accepts the supported suffix in %s",
    (fileName) => {
      expect(parseRemoteFastaUrl(`https://data.example/${fileName}`).fileName).toBe(fileName);
    },
  );

  it.each([
    ["http://data.example/assembly.fa", "HTTPS"],
    ["https://user:secret@data.example/assembly.fa", "credentials"],
    ["https://data.example/genes.gff.gz", "must end"],
    ["not a url", "complete HTTPS URL"],
  ])("rejects %s", (value, message) => {
    expect(() => parseRemoteFastaUrl(value)).toThrow(message);
  });

  it("accepts same-origin HTTP URLs served by a local preview server", () => {
    vi.stubGlobal("location", new URL("http://127.0.0.1:4178/"));
    try {
      expect(parseRemoteFastaUrl("http://127.0.0.1:4178/data/assembly.fa").url)
        .toBe("http://127.0.0.1:4178/data/assembly.fa");
      expect(() => parseRemoteFastaUrl("http://127.0.0.1:9999/assembly.fa")).toThrow("HTTPS");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("validates feature-track URLs with the same HTTPS/same-origin rule", () => {
    expect(parseRemoteTrackUrl("https://data.example/rm.bed.gz#x"))
      .toEqual({ url: "https://data.example/rm.bed.gz", fileName: "rm.bed.gz" });
    expect(() => parseRemoteTrackUrl("http://data.example/rm.bed.gz")).toThrow("HTTPS");
    vi.stubGlobal("location", new URL("http://127.0.0.1:4178/"));
    try {
      expect(parseRemoteTrackUrl("http://127.0.0.1:4178/data/rm.bed.gz").fileName).toBe("rm.bed.gz");
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("keeps query parameters while removing fragments", () => {
    expect(parseRemoteFastaUrl("https://data.example/assembly.fa?download=1#fragment").url)
      .toBe("https://data.example/assembly.fa?download=1");
  });
});
