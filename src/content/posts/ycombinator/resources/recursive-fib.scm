((lambda (mk-fib)
  (mk-fib mk-fib))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ ((fib fib) (- n 1)) ((fib fib) (- n 2))))))))
