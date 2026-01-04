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
      - paragraph [ref=e25]: "Error: Object is disposed"
    - generic [ref=e26]:
      - heading "Source" [level=2] [ref=e27]
      - generic [ref=e28]:
        - link "components/Chart/Chart.tsx (52:24) @ remove" [ref=e30] [cursor=pointer]:
          - generic [ref=e31]: components/Chart/Chart.tsx (52:24) @ remove
          - img [ref=e32]
        - generic [ref=e36]: "50 | // Clean up existing chart 51 | if (chartRef.current) { > 52 | chartRef.current.remove(); | ^ 53 | chartRef.current = null; 54 | } 55 |"
      - heading "Call Stack" [level=2] [ref=e37]
      - button "Show collapsed frames" [ref=e38] [cursor=pointer]
```