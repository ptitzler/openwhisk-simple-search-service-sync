# openwhisk-simple-search-service-sync

### OpenWhisk setup

* [Set up CLI access for OpenWhisk](https://console.ng.bluemix.net/openwhisk/getting-started)
* Take note of your namespace


### Setup

* Clone this repository

```
$ git clone https://github.com/ibm-cds-labs/openwhisk-simple-search-service-sync.git
$ cd openwhisk-simple-search-service-sync
```

* bind Cloudant package
```
$ wsk package bind /whisk.system/cloudant npsCloudant --param bluemixServiceName nps-cloudplatform-cloudant --param dbname nps-data --param host ***-bluemix.cloudant.com --param overwrite false --param username ***-bluemix --param password ***
```

> Replace `***` with your Cloudant credentials

* create Cloudant database change trigger
```
$ wsk trigger create newNPSEvent --feed /ptitzler_org_dev/npsCloudant/changes
```

> Replace `ptitzler_org_dev` with your namespace

* register SSS synch action
```
$ wsk action update synchNPSIndex ./synchNPSIndex.js
```

* Define rule to trigger index update if a document is inserted/updated/deleted
```
$ wsk rule create updateSSSforNPS newNPSEvent synchNPSIndex
```

* List artifacts

```
$ wsk list
Entities in namespace: default
packages
/ptitzler_org_dev/npsCloudant                                          private
actions
/ptitzler_org_dev/synchNPSIndex                                        private nodejs:6
triggers
/ptitzler_org_dev/newNPSEvent                                          private
rules
/ptitzler_org_dev/updateSSSforNPS                                      private
```

### Monitoring

* Insert/update/delete a document in the Cloudant repository

* Display OpenWhisk activation list

```
$ wsk activation list
activations
e...3        synchNPSIndex
4...6      updateSSSforNPS
4...7          newNPSEvent
```

* Review OpenWhisk activation result(s)

```
$wsk activation get e...3

ok: got activation e..3
...
```

> Update and delete operations will trigger an error. (Not yet supported)

### Cleanup

```
$ wsk rule disable updateSSSforNPS
$ wsk rule delete updateSSSforNPS 
$ wsk action delete synchIndex
$ wsk trigger delete newNPSEvent
```
