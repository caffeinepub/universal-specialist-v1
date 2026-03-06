import Principal "mo:core/Principal";
import Map "mo:core/Map";
import Iter "mo:core/Iter";
import Runtime "mo:core/Runtime";

actor {
  public type KnowledgeDoc = {
    id : Text;
    title : Text;
    content : Text;
    createdAt : Int;
  };

  public type DataRow = {
    id : Text;
    component : Text;
    specification : Text;
    toolsRequired : Text;
    createdAt : Int;
  };

  let knowledgeDocs = Map.empty<Principal, Map.Map<Text, KnowledgeDoc>>();
  let dataRows = Map.empty<Principal, Map.Map<Text, DataRow>>();

  func getOrCreateUser<K, V>(store : Map.Map<Principal, Map.Map<K, V>>, user : Principal) : Map.Map<K, V> {
    switch (store.get(user)) {
      case (?map) { map };
      case (null) {
        let newMap = Map.empty<K, V>();
        store.add(user, newMap);
        newMap;
      };
    };
  };

  public shared ({ caller }) func saveKnowledgeDoc(doc : KnowledgeDoc) : async () {
    let userDocs = getOrCreateUser(knowledgeDocs, caller);
    userDocs.add(doc.id, doc);
  };

  public shared ({ caller }) func deleteKnowledgeDoc(id : Text) : async () {
    switch (knowledgeDocs.get(caller)) {
      case (?userDocs) { userDocs.remove(id) };
      case (null) { Runtime.trap("No knowledge docs found for this user") };
    };
  };

  public query ({ caller }) func getKnowledgeDocs() : async [KnowledgeDoc] {
    switch (knowledgeDocs.get(caller)) {
      case (?userDocs) { userDocs.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func saveDataRow(row : DataRow) : async () {
    let userRows = getOrCreateUser(dataRows, caller);
    userRows.add(row.id, row);
  };

  public shared ({ caller }) func deleteDataRow(id : Text) : async () {
    switch (dataRows.get(caller)) {
      case (?userRows) { userRows.remove(id) };
      case (null) { Runtime.trap("No data rows found for this user") };
    };
  };

  public query ({ caller }) func getDataRows() : async [DataRow] {
    switch (dataRows.get(caller)) {
      case (?userRows) { userRows.values().toArray() };
      case (null) { [] };
    };
  };

  public shared ({ caller }) func whoami() : async Principal {
    caller;
  };
};
