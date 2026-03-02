pragma circom 2.0.0;

// Merkle tree proof verification
// Пример средней сложности для демонстрации графа

include "poseidon.circom"; // Предполагается стандартная библиотека

template MerkleProof(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;
    
    component hashers[levels];
    signal currentHash[levels + 1];
    
    currentHash[0] <== leaf;
    
    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon(2);
        
        // Выбираем порядок left/right на основе pathIndices
        hashers[i].inputs[0] <== pathIndices[i] * pathElements[i] + (1 - pathIndices[i]) * currentHash[i];
        hashers[i].inputs[1] <== pathIndices[i] * currentHash[i] + (1 - pathIndices[i]) * pathElements[i];
        
        currentHash[i + 1] <== hashers[i].out;
    }
    
    root <== currentHash[levels];
}

component main = MerkleProof(4);
