# Legal / Help QA

Verified live (Vite preview) and with automated render tests.

## Navigation
| Check | Result |
| --- | --- |
| Footer Privacy link works | ✅ opens Privacy view |
| Footer Terms link works | ✅ opens Terms view |
| Footer Help link works | ✅ opens Help view |
| No `href="#"` fake footer links | ✅ footer items are real `<button>`s (0 `#` anchors) |
| Back to Home works | ✅ returns to home; document.title restored |
| Keyboard navigable / focus visible | ✅ buttons + links are focusable with visible focus ring |
| document.title per page | ✅ "Privacy Policy — VidKing", "Terms of Use — VidKing", "Help & FAQ — VidKing" |
| Readable on mobile/tablet/desktop | ✅ `max-w-3xl` centered, responsive headings/padding |

## Content
| Requirement | Present |
| --- | --- |
| TMDB attribution ("not endorsed or certified by TMDB") | ✅ on every legal page + footer |
| Third-party services explained (Firebase/TMDB/Gemini/VidKing) | ✅ Privacy |
| Data used + storage + user control | ✅ Privacy |
| Acceptable use / no availability guarantee / AI limits / demo status | ✅ Terms |
| Help explains TV season/episode selection | ✅ FAQ |
| Help explains player-failure troubleshooting + config states | ✅ FAQ |
| No fake contact email (points to GitHub repo) | ✅ |
| Not presented as formal legal advice | ✅ stated |

## Automated coverage
`LegalPages.dom.test`: Privacy/Terms/Help headings render, TMDB attribution present,
Help includes TV episode guidance, Back fires `onBack`.
