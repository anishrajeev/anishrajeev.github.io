;Wrapper function
(lambda (mk-fib)
  (mk-fib ??))

;fib1 using the wrapper function
((lambda (mk-fib)
  (mk-fib ??))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))
