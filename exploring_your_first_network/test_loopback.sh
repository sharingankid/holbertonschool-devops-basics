#!/usr/bin/env bash
ping -c 4 "$(ip -4 -br addr show scope host | head -n1 | tr -s ' ' | cut -d' ' -f3 | cut -d'/' -f1)"
