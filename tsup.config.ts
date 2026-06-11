// Created from template  begin

import { defineConfig } from "tsup"

export default defineConfig({
    entry: ["src/*.ts"],
    clean: true,
    format: ["esm"],
    dts: true,
})

// Created from template  emd