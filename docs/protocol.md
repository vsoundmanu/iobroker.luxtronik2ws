# Luxtronik WebSocket Protocol

Status:
Reverse Engineering

---

## Login

LOGIN;<PIN>

Antwort:

Navigation

---

## Navigation

type = Navigation

Enthält

Bereiche

GET IDs

---

## GET

GET;<NavigationID>

Antwort

Content

---

## Content

type = Content

Enthält

items[]

Parameter

---

## Parameter

name

id

raw

value

type

min

max

step

options

unit

---

## Schreiben

SET;set_<id>;<raw>

anschließend

SAVE;1

Status:

noch in Analyse

---

## Beobachtungen

LuxIDs scheinen nicht dauerhaft stabil zu sein.

Ursache derzeit ungeklärt.
