(lambda (n)
  (cond
    ((zero? n) 0)
    ((zero? (- n 1)) 1)
    (else (+
            ((lambda (n)
              (cond
                ((zero? n) 0)
                ((zero? (- n 1)) 1)
                (else (+ (?? (- n 1)) (?? (- n 2)))))) (- n 1))
            ((lambda (n)
              (cond
                ((zero? n) 0)
                ((zero? (- n 1)) 1)
                (else (+ (?? (- n 1)) (?? (- n 2)))))) (- n 2))))))
