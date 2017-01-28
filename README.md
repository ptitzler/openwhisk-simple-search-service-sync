# openwhisk-simple-search-service-sync

### OpenWhisk setup

* [Set up CLI access for OpenWhisk](https://console.ng.bluemix.net/openwhisk/getting-started)

### Setup

* bind Cloudant package
```
wsk package bind /whisk.system/cloudant npsCloudant --param bluemixServiceName nps-cloudplatform-cloudant --param dbname nps-data --param host ***-bluemix.cloudant.com --param overwrite false --param username ***-bluemix --param password ***
```

* create Cloudant database change trigger
```
$ wsk trigger create newNPSEvent --feed /ptitzler_org_dev/npsCloudant/changes
```

* register SSS synch action
```
$ wsk action update synchNPSIndex ./synchNPSIndex.js
```

* define rule to trigger index update if a document is inserted/updated/deleted
```
$ wsk rule create updateSSSforNPS newNPSEvent synchNPSIndex
```

### Cleanup

```
$ wsk rule disable /ptitzler_org_dev/updateSSSforNPS
$ wsk rule delete /ptitzler_org_dev/updateSSSforNPS 
$ wsk action delete /ptitzler_org_dev/synchIndex
$ wsk trigger delete /ptitzler_org_dev/newNPSEvent
```
