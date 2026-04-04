# 在python中使用playwright调用javascript api



```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Get centerHeading</title>
</head>
<body>
<script>
function loadGoogleMaps(apiKey) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

async function getCenterHeading(apiKey, panoid) {
  await loadGoogleMaps(apiKey);

  return new Promise((resolve, reject) => {
    const sv = new google.maps.StreetViewService();
    sv.getPanorama({ pano: panoid }, (data, status) => {
      if (status === "OK" && data?.tiles?.centerHeading !== undefined) {
        resolve(data.tiles.centerHeading);
      } else {
        reject("StreetView error: " + status);
      }
    });
  });
}
</script>
</body>
</html>

```

```python
from playwright.async_api import async_playwright

async def get_panorama_meta_async(
    panoid: str, api_key: str | None = None, headless: bool = True
) -> dict:
    api_key = api_key or os.environ.get("GOOGLE_MAP_API_KEY", "")
    html_path = pathlib.Path(__file__).parent / "get_panorama_meta.html"

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=headless)
        page = await browser.new_page()
        await page.goto(f"file://{html_path.absolute().resolve()}")

        data = await page.evaluate(
            """async ({ apiKey, panoid }) => {
                return await getPanoramaData(apiKey, panoid);
            }""",
            {"apiKey": api_key, "panoid": panoid},
        )

        await browser.close()
    return data
```

