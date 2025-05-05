#!/bin/bash
# verify-xrblockdev-token.sh

# Set your token details (replace these with your actual values)
TOKEN_MINT="DLZvTdgUpfvADvhVRscTavWGtED7oRaiq8qsqoHKoVQK"
TOKEN_NAME="XRBlockDev Token"
TOKEN_SYMBOL='$XR$'
TOKEN_DECIMALS=9
NETWORK="mainnet-beta"  # or "devnet" if your  token is on devnet

# Check if required tools are installed
if ! command -v solana &> /dev/null; then
    echo "Error: Solana CLI is not installed. Please install it first."
    exit 1
fi

# Set Solana config to use the correct network
echo "Setting Solana configuration to $NETWORK..."
solana config set --url $NETWORK

# Verify token exists and fetch its information
echo "Fetching token information for $TOKEN_MINT..."
TOKEN_INFO=$(spl-token display $TOKEN_MINT 2>&1)
if [[ $? -ne 0 ]]; then
    echo "Error: Could not find token with mint address $TOKEN_MINT"
    exit 1
fi
echo "$TOKEN_INFO"

# Check if token already has metadata
echo "Checking for existing metadata..."
METADATA_ACCOUNT=$(solana account $(solana-keygen pubkey -o /dev/null --outfile /dev/null --derive "metadata/metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s/$TOKEN_MINT") 2>&1)
if [[ $? -eq 0 ]]; then
    echo "✅ Token already has metadata"
else
    echo "⚠️ Token does not have metadata. You should create metadata before submitting to token lists."
    echo "You can use the Metaplex CLI or our frontend to create metadata."
fi

# Prompt for token logo URL
read -p "Enter the URL for your token logo (PNG, 512x512px recommended): " TOKEN_LOGO_URL
if [ -z "$TOKEN_LOGO_URL" ]; then
    TOKEN_LOGO_URL="https://raw.githubusercontent.com/yourusername/your-repo/main/xrblockdev-logo.png"
    echo "Using default logo URL: $TOKEN_LOGO_URL"
    echo "⚠️ You should replace this with a real logo URL before submitting"
fi

# Prompt for website and social media
read -p "Enter your token's website URL: " TOKEN_WEBSITE
read -p "Enter your token's Twitter handle (without @): " TOKEN_TWITTER
read -p "Enter a brief description of your token: " TOKEN_DESCRIPTION

# Generate token info JSON for submission to token lists
echo "Generating token info JSON for token list submission..."
cat > xrblockdev-token-list-entry.json << EOL
{
  "chainId": 101,
  "address": "$TOKEN_MINT",
  "symbol": "$TOKEN_SYMBOL",
  "name": "$TOKEN_NAME",
  "decimals": $TOKEN_DECIMALS,
  "logoURI": "$TOKEN_LOGO_URL",
  "tags": ["utility-token", "governance"],
  "extensions": {
    "website": "${TOKEN_WEBSITE:-https://yourwebsite.com}",
    "twitter": "${TOKEN_TWITTER:-yourhandle}",
    "description": "${TOKEN_DESCRIPTION:-XRBlockDev Token is the utility and governance token for the XR Block Development platform.}"
  }
}
EOL

echo "Token list entry JSON created as xrblockdev-token-list-entry.json"

# Create directory structure for token list submission
echo "Creating directory structure for token list submission..."
mkdir -p token-list-submission/assets/mainnet/$TOKEN_MINT

# Prompt to download logo
read -p "Do you want to download the logo from $TOKEN_LOGO_URL? (y/n): " DOWNLOAD_LOGO
if [[ "$DOWNLOAD_LOGO" == "y" ]]; then
    echo "Downloading logo..."
    curl -s "$TOKEN_LOGO_URL" -o token-list-submission/assets/mainnet/$TOKEN_MINT/logo.png
    if [[ $? -eq 0 ]]; then
        echo "✅ Logo downloaded successfully"
    else
        echo "⚠️ Failed to download logo. You'll need to add it manually."
    fi
else
    echo "You'll need to add the logo manually to token-list-submission/assets/mainnet/$TOKEN_MINT/logo.png"
fi

echo "✅ Token verification preparation complete!"
echo ""
echo "Next steps for token list submission:"
echo "1. Fork the Solana Token List repository: https://github.com/solana-labs/token-list"
echo "2. Clone your fork locally: git clone https://github.com/YOUR_USERNAME/token-list.git"
echo "3. Create a new branch: git checkout -b add-xrblockdev-token"
echo "4. Copy your token logo to assets/mainnet/$TOKEN_MINT/logo.png"
echo "5. Add your token information from xrblockdev-token-list-entry.json to assets/mainnet/solana.tokenlist.json"
echo "6. Commit and push your changes"
echo "7. Create a pull request to the main repository"
echo ""
echo "For Jupiter Aggregator listing (recommended):"
echo "1. Fork: https://github.com/jup-ag/token-list"
echo "2. Follow similar steps to add your token"
