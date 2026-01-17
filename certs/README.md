# SSL Certificates

To enable HTTPS, please place your certificate files in this directory:

1.  **Private Key**: Rename to `key.pem`
2.  **Certificate**: Rename to `cert.pem`

The server will automatically detect these files on startup and switch to HTTPS mode.
If these files are missing, the server will default to HTTP.
