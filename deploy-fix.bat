@echo off
cd /d "%~dp0"
echo A adicionar alteracoes...
git add .
echo
echo A criar commit...
git commit -m "Fix: Light mode SSR hydration mismatch - agora funciona no Vercel"
echo
echo A fazer push para o Vercel...
git push
echo
echo Done! O Vercel vai atualizar automaticamente.
pause
