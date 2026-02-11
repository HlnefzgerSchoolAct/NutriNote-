# NutriNote+ - Vercel Deployment Guide

## Prerequisites

1. A GitHub account with the NutriNote+ repository
2. A [Vercel](https://vercel.com) account (free tier works)
3. An OpenRouter API key (for AI nutrition estimation)

## Quick Deploy

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/HlnefzgerSchoolAct/NutriNote+)

### Option 2: Manual Deploy

1. **Connect Repository**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Vercel auto-detects Create React App

2. **Configure Build Settings** (auto-detected)
   - Framework Preset: `Create React App`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Add Environment Variables**
   - Go to Project Settings → Environment Variables
   - Add: `OPENROUTER_API_KEY` = `your_api_key_here`
   - Add: `USDA_API_KEY` = `your_usda_fdc_api_key_here`
   - Enable for: Production, Preview, Development

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes for build completion

## Environment Variables

| Variable             | Required | Description                                          |
| -------------------- | -------- | ---------------------------------------------------- |
| `OPENROUTER_API_KEY` | Yes      | API key for AI nutrition estimation                  |
| `USDA_API_KEY`       | Yes      | USDA FoodData Central API key (free at fdc.nal.usda.gov) |

## Project Structure for Vercel

```
NutriNote+/
├── api/                     # Vercel Serverless Functions
│   ├── estimate-nutrition.js   # AI nutrition endpoint
│   └── identify-food-photo.js  # Photo food identification + USDA lookup
├── build/                   # Production build (auto-generated)
├── public/                  # Static assets
├── src/                     # React source code
├── vercel.json              # Vercel configuration
└── package.json             # Dependencies
```

## Serverless Functions

The AI nutrition feature uses a Vercel Serverless Function:

- **Endpoint**: `POST /api/estimate-nutrition`
- **Location**: `api/estimate-nutrition.js`
- **Rate Limit**: 30 requests per 15 minutes per IP

The photo food identification feature uses a second serverless function:

- **Endpoint**: `POST /api/identify-food-photo`
- **Location**: `api/identify-food-photo.js`
- **Rate Limit**: 20 requests per 15 minutes per IP
- **Flow**: Gemini Vision identifies food → USDA FoodData Central lookup → AI fallback if needed

### API Usage

```json
POST /api/estimate-nutrition
Content-Type: application/json

{
  "foodDescription": "1 medium apple"
}

Response:
{
  "nutrition": {
    "calories": 95,
    "protein": 0.5,
    "carbs": 25,
    "fat": 0.3
  },
  "cached": false,
  "responseTime": 1200
}
```

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS as instructed
4. SSL is automatic

## Troubleshooting

### AI Estimation Not Working

1. Check Environment Variables in Vercel dashboard
2. Verify `OPENROUTER_API_KEY` is set correctly
3. Check Vercel Function logs for errors

### Build Failures

1. Ensure all dependencies are in `package.json`
2. Check for ESLint errors: `npm run build` locally
3. Review Vercel build logs

### Rate Limiting

- Free tier: 30 requests per 15 minutes per IP
- If exceeded, users see a friendly error message
- Limits reset automatically

## Development vs Production

| Feature      | Development              | Production            |
| ------------ | ------------------------ | --------------------- |
| API Endpoint | `localhost:5001` (proxy) | `/api/*` (serverless) |
| Hot Reload   | Yes                      | No                    |
| Source Maps  | Yes                      | No                    |
| Optimized    | No                       | Yes                   |

## Monitoring

### Vercel Dashboard

- View deployments
- Check function logs
- Monitor usage

### Function Logs

- Go to Project → Logs
- Filter by function name
- See request/response details

## Security Notes

1. **API Key**: Never expose in frontend code
2. **CORS**: Configured for your domain only in production
3. **Rate Limiting**: In-memory per serverless instance
4. **Data Privacy**: All user data stays in browser localStorage

## Cost Estimation (Free Tier)

- **Vercel Free Tier**:
  - 100GB bandwidth/month
  - 100,000 serverless function invocations/month
  - Unlimited deployments

- **OpenRouter**:
  - Pay per token (very affordable for nutrition queries)
  - ~$0.0001 per estimation request

## Updates

To deploy updates:

1. Push changes to GitHub main branch
2. Vercel auto-deploys within ~2 minutes
3. Preview deployments for PRs

---

For more help, check the [Vercel Documentation](https://vercel.com/docs).
