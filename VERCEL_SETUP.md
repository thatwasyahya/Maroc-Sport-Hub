# Configuration Vercel - Variables d'environnement

Pour que le formulaire de contact fonctionne correctement sur Vercel, vous devez configurer les variables d'environnement suivantes :

## Étapes de configuration

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet "Maroc-Sport-Hub"
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

### Variables EmailJS

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `NEXT_PUBLIC_EMAILJS_SERVICE_ID` | `service_eupc8ii` | Production, Preview, Development |
| `NEXT_PUBLIC_EMAILJS_TEMPLATE_ID` | `template_vm9zi2c` | Production, Preview, Development |
| `NEXT_PUBLIC_EMAILJS_PUBLIC_KEY` | `yTp7-K9PDOMJVVHQU` | Production, Preview, Development |

## Notes importantes

- **Toutes ces variables doivent commencer par `NEXT_PUBLIC_`** car elles sont utilisées côté client
- Cochez **Production**, **Preview**, et **Development** pour chaque variable
- Après avoir ajouté les variables, **redéployez votre application** pour que les changements prennent effet
- Si vous ne configurez pas ces variables, le formulaire fonctionnera en "mode demo" et n'enverra pas d'emails

## Comment redéployer

Après avoir ajouté les variables d'environnement :

1. Allez dans l'onglet **Deployments**
2. Cliquez sur les trois points à côté du dernier déploiement
3. Sélectionnez **Redeploy**
4. Cochez "Use existing Build Cache" si vous voulez un déploiement plus rapide
5. Cliquez sur **Redeploy**

Ou simplement faites un nouveau push sur votre branche `main` :
```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

## Vérification

Une fois redéployé, testez le formulaire de contact sur votre site en production. Vous ne devriez plus voir le message "(Mode demo)" et les emails devraient être envoyés à votre boîte mail.
