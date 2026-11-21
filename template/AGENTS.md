## Disposable browser tests on this host

Use a fresh disposable browser profile with no real account credentials for
browser tests. Headless Chrome must include `--use-mock-keychain`.
Prefer Playwright's managed browser lifecycle and always close browsers in a
`finally` block. Do not leave standalone headless Chrome processes running.
Do not use an existing browser profile, change the login keychain or reset it.

Give each test its own temporary profile and files. When direct CDP is needed,
use a dynamically assigned debugging port and connect only to that test browser.
