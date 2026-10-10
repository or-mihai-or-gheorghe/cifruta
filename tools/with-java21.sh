#!/bin/sh
# Emulatoarele Firebase (firebase-tools 15) cer Java 21. Caută, pe rând, JDK-ul portabil din ~/.cache/cifruta/jdk-21 și openjdk@21
# din Homebrew (Apple Silicon, apoi Intel); dacă nu găsește niciunul, rămâne Java-ul sistemului. Instalare: README, „Mediul de lucru”.
for JDK in "$HOME/.cache/cifruta/jdk-21" \
  /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home \
  /usr/local/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home; do
  if [ -x "$JDK/bin/java" ]; then
    JAVA_HOME="$JDK"
    PATH="$JDK/bin:$PATH"
    export JAVA_HOME PATH
    break
  fi
done
exec "$@"
