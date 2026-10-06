---
title: Certificates
---

# Certificates

Except for VLESS + Reality, the other four protocols need a valid certificate. EasySB requests certificates from Let's Encrypt inside the panel's own process through `go-acme/lego/v5`, using HTTP-01 standalone validation: no `acme.sh` download and no socat or other listener.

## Issuance flow

1. Enter the domain and ACME email; the panel first runs a DNS pre-check.
2. Stop the sing-box core to free port 80.
3. lego answers the HTTP-01 challenge on port 80.
4. After obtaining the certificate, write it to disk private key first, certificate after.
5. Reload the core and the subscription service.

The pre-check resolves the domain and compares it with the machine's public IP, reporting "where the domain currently points" as a fact for the operator. It does not jump to a conclusion: a domain can resolve to a CDN address and still be issued; but a stale A record pointing at a decommissioned host makes the whole issuance fail, so the pre-check mentions the remaining resolved addresses and, after a failure, points out exactly which address is unreachable.

::: tip
A CDN (Cloudflare's orange cloud, for example) answers HTTP-01 itself, and the challenge request never reaches the machine. This kind of failure usually shows a URL the machine has never seen; check whether DNS points directly at the machine.
:::

::: tip
`EASYSB_ACME_STAGING=1` sends the whole flow to the Let's Encrypt staging endpoint, where certificates are untrusted but consume no production rate limit, which is handy for first working out a domain.
:::

## Certificate status and operations

The `Domain Management` screen offers:

- Request a certificate (with environment and DNS pre-checks).
- View issued certificates and their expiry times.
- Switch the active domain.
- Delete a domain's certificate.
- Renew now and manage the renewal timer.

The certificate state directory defaults to `/etc/sing-box/acme`, overridable with `EASYSB_ACME_DIR`. Inside it, `account.key` and `account.json` hold the ACME account (`0600`), with one subdirectory per domain containing `fullchain.cer` (`0644`) and `private.key` (`0600`).

## Self-signed placeholder and cert.Usable

Before a real certificate is issued, the panel generates a self-signed placeholder in `/etc/sing-box/cert/`, so the core configuration can always be rendered and the panel can start first. It is only a placeholder: clients reject self-signed certificates, so the subscription service does not terminate TLS with it.

`cert.Usable(domain)` is the single decision function, and it requires a real certificate issued by the panel; a self-signed placeholder does not count. The protocol of the subscription URL (http / https) and the certificate the subscription listener loads ask this same question, so the two never disagree. See [Subscription](/en/features/subscription) for how certificate usability relates to the subscription service.

## Renewal

Renewal is driven by expiry: `cert.RenewBefore` is 30 days, a nightly renewal check skips certificates that do not need renewing yet without asking the CA, and a failure for one domain does not block the others.

Renewal is driven by the panel's own systemd timer, whose unit records the binary path that wrote it, so it should be installed by the panel rather than copied between hosts:

```bash
# Install the renewal timer
easysb --install-renew-timer

# Remove the renewal timer
easysb --remove-renew-timer

# Renew every certificate now, reloading sing-box and the subscription service only when something was renewed
easysb --renew-certs
```

The renewal unit `easysb-acme.timer` runs once a day with a randomized delay; renewal replaces the certificate pair in place, so a core that was "renewed but not reloaded" is still using the old certificate, which is exactly why `--renew-certs` reloads services.

## Rate limits and repeated issuance

Let's Encrypt allows only five duplicate certificates per domain per week. EasySB does two things about it:

- While the current certificate is still valid, requesting again returns success directly with the reason and places no order; to replace early, delete first.
- The nightly renewal check orders only for certificates entering the 30-day window and skips the rest.

On the relationship between account key files and the account itself: `account.key` represents the account, while `account.json` merely caches the account URL. When `account.json` is lost, the panel re-registers with the key it still holds and recovers the same account; losing the key means a new account.

## Certificate paths in templates

The `certificate_path` and `key_path` in the protocol samples under `templates/` are sample values. Deployment fills in the real paths automatically; when used by hand they must be replaced, and file permissions tightened to `600`. The certificate list is in [Config Templates](/en/config/templates).
