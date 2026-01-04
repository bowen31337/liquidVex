# Page snapshot

```yaml
- dialog "Unhandled Runtime Error" [ref=e4]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - generic [ref=e7]:
        - navigation [ref=e8]:
          - button "previous" [disabled] [ref=e9]:
            - img "previous" [ref=e10]
          - button "next" [disabled] [ref=e12]:
            - img "next" [ref=e13]
          - generic [ref=e15]: 1 of 1 error
          - generic [ref=e16]:
            - text: Next.js (14.2.35) is outdated
            - link "(learn more)" [ref=e18] [cursor=pointer]:
              - /url: https://nextjs.org/docs/messages/version-staleness
        - button "Close" [ref=e19] [cursor=pointer]:
          - img [ref=e21]
      - heading "Unhandled Runtime Error" [level=1] [ref=e24]
      - paragraph [ref=e25]: "Error: Cannot update oldest data, last time=[object Object], new time=[object Object]"
    - generic [ref=e26]:
      - heading "Source" [level=2] [ref=e27]
      - generic [ref=e28]:
        - link "components/Chart/Chart.tsx (173:31) @ update" [ref=e30] [cursor=pointer]:
          - generic [ref=e31]: components/Chart/Chart.tsx (173:31) @ update
          - img [ref=e32]
        - generic [ref=e36]: "171 | 172 | if (candleSeriesRef.current && chartType === 'candles') { > 173 | candleSeriesRef.current.update(formatted); | ^ 174 | } else if (lineSeriesRef.current && chartType === 'line') { 175 | lineSeriesRef.current.update({ 176 | time: formatted.time,"
      - heading "Call Stack" [level=2] [ref=e37]
      - button "Show collapsed frames" [ref=e38] [cursor=pointer]
```