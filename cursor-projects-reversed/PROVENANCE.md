# Provenance

Recovered from the named public macOS arm64 installer only:

| Field | Value |
| --- | --- |
| Input | `/Users/jasper/Downloads/Cursor-darwin-arm64.dmg` |
| DMG SHA-256 | `a3cf86050ea4c322b8a63fa840f35a54318c46da9b33281c2b223a17e473c738` |
| Product | Cursor |
| App version (Info.plist) | 3.20.17 |
| Bundle ID | `com.todesktop.230313mzl4w4u92` |
| `product.json` version | 3.20.17 |
| `product.json` commit | `0c32194e3fb5ffaced9fb36430b860ec301e1fc0` |
| VS Code base | 1.128.0 |
| Build date | 2026-09-12T03:16:10.634Z |
| Data folder | `.cursor` |

## Payload identity

This DMG is a VS Code-style unpacked tree, **not** a single Electron `app.asar`.

| Artifact | Identity |
| --- | --- |
| Payload root | `Cursor.app/Contents/Resources/app` |
| Classic `app.asar` | **absent** |
| `node_modules.asar` | empty stub `{"files":{}}` SHA-256 `daf0b84ce274cb8dc423dc5e2a57a799d2c12c1d4793051716333beaade07982` |
| `workbench.glass.main.js` | SHA-256 `4b02d0d6d8a54ef3d191db50f1bde8b6b2c16cfc37cabf94d59d2e17f20feb4b` (45 174 252 bytes) |
| `workbench.desktop.main.js` | SHA-256 `6dbdfff3a20622f6875bc1c345f95e6f15e1abe36f6f74cb578f95caf07496c7` (38 272 882 bytes) |
| `out/main.js` | SHA-256 `d15ee82247f73accfa24097ea416ca398910ffaa7c6d0fee360e10850c552ee6` |
| `product.json` | SHA-256 `c30941ccc18b0db36bdfceebd1cf4ac8a66e60d37bb17d63d8e3fcf7097c54c2` |

Glass/desktop bundles point at internal source maps (`http://go/sourcemap/sourcemaps/<commit>/...`) that are not in the DMG. Recovery therefore uses shipped `O({"<file>.js"()` module names, `//# sourceURL` where present, and distinctive strings.

Machine-readable copy: `provenance.json` (written by `npm run recover`).
