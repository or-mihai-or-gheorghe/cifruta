#!/bin/sh
# Emulatoarele Firebase (firebase-tools 15) cer Java 21. Dacă există JDK-ul portabil din ~/.cache/cifruta/jdk-21, îl folosim;
# altfel rămâne Java-ul sistemului. Instalare: vezi docs/cloud.md.
JDK="$HOME/.cache/cifruta/jdk-21"
if [ -x "$JDK/bin/java" ]; then
  JAVA_HOME="$JDK"
  PATH="$JDK/bin:$PATH"
  export JAVA_HOME PATH
fi
exec "$@"
