@echo off
title ABS Store - Version Web
cd /d "%~dp0"
echo ============================================================
echo   ABS STORE PIECES AUTOS - Version Web
echo ============================================================
echo.
echo   Demarrage du serveur... (laissez cette fenetre ouverte)
echo.
echo   Une fois "version web prete" affichee, ouvrez dans un
echo   navigateur : http://localhost:8790
echo   Depuis un autre appareil (telephone, tablette, PC) sur le
echo   meme reseau : http://VOTRE-IP:8790  (l'adresse s'affiche ci-dessous)
echo.
echo   Pour arreter : fermez cette fenetre.
echo ============================================================
echo.
call npm run web
echo.
echo   Le serveur s'est arrete. Appuyez sur une touche pour fermer.
pause >nul
