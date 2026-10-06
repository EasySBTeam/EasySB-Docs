---
title: Uninstall
---

# Uninstall

Uninstalling has two steps: run the built-in uninstall entry in the panel to remove services, rules, configuration and the shortcut, then remove the package itself with apt if desired.

## In-panel uninstall

Run it from the last main-menu item, `Uninstall script`. The panel handles things in this order:

1. Archive `/etc/sing-box` into `/root/easysb-backup-<timestamp>.tar.gz`.
2. Move the issued certificate directory aside temporarily so the next step does not drop it while deleting the working directory.
3. Stop and disable `sing-box.service` and `easysb.service`.
4. Remove the port-hopping DNAT rules and `easysb-firewall.service`.
5. Remove the service units the panel wrote itself.
6. Delete the working directory `/etc/sing-box`.
7. Delete the shortcut and panel paths (such as `/usr/bin/easysb`, `/usr/bin/sb`).
8. Put the certificate directory back in place.

### What is kept

- Issued certificates and the ACME account, by default under `/etc/sing-box/acme/` (overridable with `EASYSB_ACME_DIR`). They are kept so a reinstall does not have to ask Let's Encrypt again and waste issuance quota.
- The configuration backup archive under `/root`.

### What is removed

- The `sing-box.service` and `easysb.service` systemd units.
- Port-hopping rules and `easysb-firewall.service`.
- The working directory `/etc/sing-box` (the certificate directory is put back before the end and is unaffected).
- The panel shortcut.

::: warning
The built-in uninstall does not remove the `.deb` package and does not delete the apt source. Continue to the next section for a full cleanup.
:::

## Remove the package manually

The package is managed by apt, so remove it with apt:

```bash
# Remove the package, keep configuration
sudo apt remove easysb

# Remove the configuration too
sudo apt purge easysb

# Clean up dependencies that are no longer needed
sudo apt autoremove
```

To remove the apt source and key as well:

```bash
sudo rm -f /etc/apt/sources.list.d/easysb.list
sudo rm -f /usr/share/keyrings/easysb-archive-keyring.gpg
sudo apt update
```

## Reinstalling after uninstall

On reinstall the certificate directory is still in place and the panel reuses it, with no re-issuance. If the certificate directory was also deleted, the next request registers a new ACME account and re-issues; re-issuing the same domain within a week is quota-limited, so keep that in mind.

## Next steps

- The install flow and apt source details are in [Install](/en/guide/install).
- For questions, see [FAQ](/en/faq).
