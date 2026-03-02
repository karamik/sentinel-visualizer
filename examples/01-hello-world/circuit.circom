pragma circom 2.0.0;

// Простейший пример для тестирования Sentinel Visualizer
// Multiplier: проверяет что c = a * b

template Multiplier() {
    signal input a;
    signal input b;
    signal output c;
    
    // Constraint: c === a * b
    c <== a * b;
}

component main = Multiplier();
