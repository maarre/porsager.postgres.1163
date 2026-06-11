# Purpose
Example code to illustrate bug report https://github.com/porsager/postgres/issues/1163
# The example code
I have taken a working example application and removed a lot of code. The remaining code is working. The make.sh creates the database, builds the application, and imports 20 files in parallel.
# How to recreate the error
## Build with 3.4.7
### Run the make.sh
Either run the make.sh (after looking into it of course) or follow the steps in the following chapter.

There are a lot of warnings and errors because the same values are inserted in the same table in parallel. Don´t worry. I will take some time to do the import.
### Just install and build
If you dont have time to run the example or don't want to execute unknown code:
```
npm install
npm run build
```
There should be no errors
## Build with 3.4.9
Change the version i package.json to 3.4.9
```
$ git diff package.json
diff --git a/package.json b/package.json
index 25746fb..2570e17 100644
--- a/package.json
+++ b/package.json
@@ -1,7 +1,7 @@
 {
   "dependencies": {
     "commander": "14.0.3",
-    "postgres": "3.4.7",
+    "postgres": "3.4.9",
     "uuid": "13.0.0",
     "loglayer": "9.1.0",
     "prexit": "2.3.0",
```
Install it:
```
$ npm install

changed 1 package in 12s

27 packages are looking for funding
  run `npm fund` for details
```
And build
```
$ npm run build

> d7-dog_subsidy-wrappers@1.0.1775713576172+alpha build
> tsc && tsup

src/importdog.ts:52:107 - error TS2345: Argument of type 'TransactionSql<{}>' is not assignable to parameter of type 'Sql<{}>'.
  Type 'TransactionSql<{}>' is missing the following properties from type 'Sql<{}>': CLOSE, END, PostgresError, options, and 7 more.

52                 const breeder_first_name_pk = await sp_firstnames_create_v1(breeder_first_name, uuidv4(), conn)
                                                                                                             ~~~~

src/importdog.ts:59:103 - error TS2345: Argument of type 'TransactionSql<{}>' is not assignable to parameter of type 'Sql<{}>'.
  Type 'TransactionSql<{}>' is missing the following properties from type 'Sql<{}>': CLOSE, END, PostgresError, options, and 7 more.

59                 const owner_first_name_pk = await sp_firstnames_create_v1(owner_first_name, uuidv4(), conn)
                                                                                                         ~~~~

src/importdog.ts:67:103 - error TS2345: Argument of type 'TransactionSql<{}>' is not assignable to parameter of type 'Sql<{}>'.
  Type 'TransactionSql<{}>' is missing the following properties from type 'Sql<{}>': CLOSE, END, PostgresError, options, and 7 more.

67                     const mom_first_name_pk = await sp_firstnames_create_v1(mom_first_name, uuidv4(), conn)
                                                                                                         ~~~~

src/importdog.ts:76:109 - error TS2345: Argument of type 'TransactionSql<{}>' is not assignable to parameter of type 'Sql<{}>'.
  Type 'TransactionSql<{}>' is missing the following properties from type 'Sql<{}>': CLOSE, END, PostgresError, options, and 7 more.

76                     const master_first_name_pk = await sp_firstnames_create_v1(master_first_name, uuidv4(), conn)
                                                                                                               ~~~~


Found 4 errors in the same file, starting at: src/importdog.ts:52

```
