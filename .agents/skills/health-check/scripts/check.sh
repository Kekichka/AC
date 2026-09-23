#!/bin/bash
curl -s -f http://localhost:3000/api/health || exit 1
