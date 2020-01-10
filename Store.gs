// 34567890123456789012345678901234567890123456789012345678901234567890123456789

// JSHint - TODO
/* jshint asi: true */

(function() {"use strict"})()

// Store.gs
// ========
//

var LOCK_WAIT_MS_ = 5000

/**
 * Reading in a store, making changes and then writing them
 * back to the properties service, so stop any other changes being made to the
 * table whilst we are working on it
 *
 * @param {PropertiesService.getDocumentProperties() ||
 *         PropertiesService.getScriptProperties() ||
 *         PropertiesService.getUserProperties()} properties
 *
 * @param {Object} config 
 *
 *   @param {String} name
 *
 *   @param {LockService.getDocumentLock() ||
 *         LockService.getScriptLock() ||
 *         LockService.getUserLock()} lock
 *
 *   @param {this.log} log A logging service
 */

// TODO - Make lock & log optional

function getStore(config) {

  var property = config.properties.getProperty(config.storeName)

  if (property !== null && config.createNew) {
    throw new Error('There is already a store called "' + storeName + '"')
  }

  return new Store_(config)
}

// A JSON object - one-level deep - stored in the single key of a PropertiesService

function Store_(config) {

  if (config.hasOwnProperty('properties')) {
    this.properties = config.properties
  } else {
    throw new Error('No "properties" in config')
  }

  if (config.hasOwnProperty('log')) {
    this.log = config.log
  } else {
    this.log = {functionEntryPoint: function() {}, fine: function() {}}
  }

  if (config.hasOwnProperty('lock')) {
    this.lock = config.lock
    this.lockWait = config.lockWait || LOCK_WAIT_MS_
  } else {
  
    this.lock = {
  
      locked: false,
      
      lock: function() {
        this.locked = true
      },
      
      releaseLock: function() {
        this.locked = false
      },
      
      hasLock: function() {
        return this.locked
      },
      
      waitLock: function() {},
    }
    
    this.lockWait = 0
  }

  if (config.hasOwnProperty('name')) {
    this.name = config.name
  } else {
    throw new Error('No "name" in config')
  }

  /**
  * Get store
  *
  * @return {Object} store (maybe empty)
  */
  
  this.get = function() {
    
    this.log.functionEntryPoint()
    
    var tableString = this.properties.getProperty(this.name)
    
    this.log.fine('getTable: ' + tableString)
    
    if (tableString === null) {
      this.log.fine('The store is empty')
      return {}
    }
    
    return JSON.parse(tableString)
    
  } // Store.get() 
  
  /**
  * Get a property for a particular key
  *
  * @param {String} key
  *
  * @return {String} property or null
  */
  
  this.getProperty = function(key) {
    
    this.log.functionEntryPoint()
    
    var lookupTable = this.get()
    var property
    
    if (!lookupTable.hasOwnProperty(key)) {
      this.log.fine('There is no property for key: "' + key + '"')
      return null
    }
    
    property = lookupTable[key]
    this.log.fine('property: ' + property)
    return property
    
  } // Store.getProperty() 
  
  /**
  * Upate the store
  *
  * @param {Object} table
  */
  
  this.set = function(table) {
    
    this.log.functionEntryPoint()
    
    if (!this.lock.hasLock()) {
//      throw new TypeError('Trying to update store without first locking it')
    }
    
    var tableString = JSON.stringify(table)
    this.properties.setProperty(this.name, tableString) 
    this.log.fine('setTable: ' + tableString)
    
  } // Store.set() 
  
  /**
   * Store a property in store
   *
   * @param {String} eventManagerName
   * @param {String} folderId
   */
  
  this.setProperty = function(key, property) {
    
    this.log.functionEntryPoint()
    
    this.log.fine('key: ' + key)
    this.log.fine('property: ' + property)
    
    this.lockStore()
    
    var lookupTable = this.get()
    
    if (!lookupTable.hasOwnProperty(key)) {      
      lookupTable[key] = {}
      this.log.fine('Initialised store entry for "' +  key + '"')        
    }
    
    lookupTable[key] = property
    this.set(lookupTable)
    
    this.releaseStore()
    
  } // Store.setProperty() 

  /**
   * Delete the whole store
   */
  
  this.deleteStore = function() {
    
    this.log.functionEntryPoint()
    this.properties.deleteProperty(this.name)
    this.log.fine('Deleted store "' + this.name + '"')
    
  } // Store.deleteStore() 

  /**
   * Delete entry for store
   *
   * @param {String} key
   */
  
  this.deleteProperty = function(key) {
    
    this.log.functionEntryPoint()
    
    this.lockStore()
    
    var lookupTable = this.get()
    
    if (!lookupTable.hasOwnProperty(key)) {
      
      this.log.fine('There is no property stored for the key "' + key + '"')
      
    } else {
      
      delete lookupTable[key]
      this.log.fine('Deleted property for "' + key + '"')
    }
    
    this.set(lookupTable)
    
    this.releaseStore()
    
  } // Store.deleteEntry() 
  
  /*
  * Get lock, but check it hasn't been got elsewhere, because then
  * we may accidentally unlock something else
  */
  
  this.lockStore = function() {
    
    this.log.functionEntryPoint()
    
    if (this.lock.hasLock()) {
//      throw new TypeError('Already got lock')
    }
    
    this.lock.waitLock(this.lockWait)
    this.log.fine('Got lock')
    
  } // lock_() 
  
  /**
  * Release the store for other instances of the script
  */
  
  this.releaseStore = function () {
    
    this.log.functionEntryPoint()

    if (!this.lock.hasLock()) {
//      throw new TypeError('Releasing lock uneccesarily')
    }
    
    this.lock.releaseLock()
    this.log.fine('Released lock')
    
  } // release_() 
  
} // Store_