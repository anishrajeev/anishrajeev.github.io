---
title: "The Y-Combinator"
date: 2023-11-03T00:00:00+08:00
---
Richard Feynman famously said "The more you teach, the better you learn". I recently finished [The Little Schemer](https://mitpress.mit.edu/9780262560993/the-little-schemer/) ([my review](https://www.goodreads.com/review/show/5950310328)) in which I found some topics difficult to wrap my head around. So in an attempt to gain a better grasp, today I will be trying to explain one of these ideas: the YCombinator. Info on the YCombinator is shockingly difficult to find online, as the web only seems to rank searches about VC and hackernews, but basically the YCombinator is an implementation of recursion in languages with first class functions and no recursion. What is a first class function? More a property of a programming language, if a language has first class functions it means that you can declare anonymous functions, you can pass functions as arguments, functions can return other functions, and you can store functions in variables. It basically means that the language treats functions as "first class citizens". Languages like C and Java do not(as far as I know, there's always crazy workarounds on stackoverflow) have first class functions, while languages like Lisp and Haskell do.

## Motivation
Why do we need to implement recursion? We already have languages that can recurse and do a bunch of other fancy whatnot, right? Well, for a long time academics studied how minimal can they make their languages while still maintaining certain abilities. As such, the YCombinator(invented by Haskell Curry) and other methods were devised to implement recursion in languages with recursion not enabled as a feature(for example, lambda calculus does not have recursion as it is all anonymous functions). This is an extremely counterintuitive idea that took some time for me to digest. You can implement recursion, something that seems like a core axiom/atom of nature, in a language without recursion?!

## Scheme basics
Before we get into deriving the YCombinator, we're going to review some Scheme basics incase you don't have any experience with scheme. Scheme has three main datatypes: S-expressions, lists, and atoms. atoms are the base of everything: things like 1, atom(yes atom itself is an atom), water, and book are atoms. Lists are defined as a collection of S-expressions; we denote lists in scheme without commas and with parenthesis. Some examples of lists are: (1 2 3), (atom), (), ((1 2 3) 2 ()), ((1)), and more. Finally, S-expressions are any atoms or lists. So any of the examples I listed above are indeed S-expressions. 

To define anonymous functions, we use a list composed of 3 elements: the lambda keyword, a list of formal parameters(the arguments to the function), and the actual function itself. So, an example of the identity function would be
{{< highlight Scheme >}}
(lambda (x) x)
{{< / highlight >}}
{{< highlight Scheme >}}
(lambda (x y) (+ x y))
{{< / highlight >}}

We can ask questions about certain statements in Scheme. One such question we can ask is zero? When put in front of a number, it will evaluate to a boolean depending on whether the number is 0 or not. We use these questions, in addition with the cond statement, to control the control flow. The cond statement is a list of S-expressions, where the first item(we call this the "car" of the list) is the atom cond and the rest of the list(the tail, which in Scheme we call the "cdr" of the list) are pairs(list with two elements) where the first element evaluates to a boolean and the second element is an action to complete. For example, here is the function that says if a number is odd or even

{{< highlight Scheme >}}
(lambda (num)
  (cond
    ((zero? (modulo num 2)) #t)
    (else #f)))
{{< / highlight >}}
Finally, since Scheme does support recursion and it is the topic of discussion, here is the Fibonacci sequence in Scheme, using the define keyword

{{< highlight Scheme >}}
(define fibonacci
  (lambda (n)
    (cond
      ((zero? n) 0)
      ((zero? (- n 1)) 1)
      (else (+ (fibonacci (- n 1)) (fibonacci (- n 2)))))))
{{< / highlight >}}

## Derivation

Ok, now that we are through the background section, here is where it gets heavy. Let's look back at the Fibonacci function. We want to be able to write this function with just anonymous functions(i.e. we want to write this function without using define). Let's attempt to first write fib1(?? is a blank; we don't know what to put there yet), a function that can handle the two base cases only

{{< highlight Scheme >}}
(lambda (n)
  (cond
    ((zero? n) 0)
    ((zero? (- n 1)) 1)
    (else (+ (?? (- n 1)) (?? (- n 2))))))
{{< / highlight >}}

 As you can see, the function is only defined on n = 0 and n = 1(ergo the name fib1; going forward, fibn is defined on 0 through n), the two base cases of fibonacci. But the astute reader might have noted that we can in fact construct fib2 from this code, and fib3, fib4, fib5, etc. By replacing the ?? with the method itself, we have constructed fib2!

{{< highlight Scheme >}}
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
{{< / highlight >}}

We can keep replacing the ??s with fib1, each time increasing the amount of numbers it can handle(fib2 can handle up to n = 2, fib3 with n = 3, etc). But, we can never actually fully construct fib! Because there is a finite limit  on the length of code(we can't have a function of infinite length), there will always be an input n where it breaks and reaches the ?? function. Replacing 2n  ??s for fibn is going to get really annoying really quick. Let's instead try something different. We notice that we have a lot of repeated code. What if we create a new function, base fib, that takes in a function and uses it in our definition of fib0 instead of ??. Then, we can simply apply base fib to itself over and over! The following code snippet shows the creation of fib1, fib2, and fib3, but we can keep on continuing, creating a tower of infinite length, to get "recursion".

{{< highlight Scheme >}}
;base fib
(lambda (fib)
  (lambda (n)
    (cond
      ((zero? n) 0)
      ((zero? (- n 1)) 1)
      (else (+ (fib (- n 1)) (fib (- n 2)))))))

;fib1
((lambda (fib)
  (lambda (n)
    (cond
      ((zero? n) 0)
      ((zero? (- n 1)) 1)
      (else (+ (fib (- n 1)) (fib (- n 2)))))))
 (lambda (fib)
   (lambda (n)
     (cond
       ((zero? n) 0)
       ((zero? (- n 1)) 1)
       (else (+ (fib (- n 1)) (fib (- n 2))))))))

;fib2
((lambda (fib)
   (lambda (n)
     (cond
       ((zero? n) 0)
       ((zero? (- n 1)) 1)
       (else (+ (fib (- n 1)) (fib (- n 2)))))))
 ((lambda (fib)
   (lambda (n)
     (cond
       ((zero? n) 0)
       ((zero? (- n 1)) 1)
       (else (+ (fib (- n 1)) (fib (- n 2)))))))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))))

;fib3
((lambda (fib)
  (lambda (n)
    (cond
      ((zero? n) 0)
      ((zero? (- n 1)) 1)
      (else (+ (fib (- n 1)) (fib (- n 2)))))))
 ((lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))
  ((lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))
   (lambda (fib)
     (lambda (n)
       (cond
         ((zero? n) 0)
         ((zero? (- n 1)) 1)
         (else (+ (fib (- n 1)) (fib (- n 2))))))))))
{{< / highlight >}}

This still isn't true recursion, though. It definitely is a lot cleaner than our previous approach. Something we have to keep in mind as we are working is that we're not creating recursion just for the fib method here. We want something bigger: we want a general solution for recursion, where you can pass in any function. Additionally, this doesn't really solve our problem of repeated code, does it. Let's try abstracting the base fib function out of this mess, and have another function do the work of applying them together.  Let's call this function the wrapper function. We'll pass the wrapper function our fib function that we made in the last code block, and let the wrapper function do something with it.

{{< highlight Scheme >}}
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
{{< / highlight >}}

Hmm... This doesn't entirely feel right. That still is our fib1, but, we just got rid of the ??s. Let's not bring them back. Another observation we can make is that we can simulate what we did in the last code block(fibtower.scm) and pass fib to itself! We know that mk-fib, is actually the function fib. So, what if we pass mk-fib to itself! Here is fib2 and fib3, using just that approach.

{{< highlight Scheme >}}
;fib1
((lambda (mk-fib)
  (mk-fib mk-fib))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))

;fib2
((lambda (mk-fib)
  (mk-fib 
   (mk-fib mk-fib)))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))

;fib3
((lambda (mk-fib)
  (mk-fib 
   (mk-fib 
    (mk-fib mk-fib))))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))
{{< / highlight >}}

That yielded good results. Again, not exactly recursion per se, but we are definitely getting there. The final step to get our code recursive is an extremely elegant move. Let's notice that our function fibn "dies" out if passed in n+1, because it reaches the last layer and it isn't passed in a function. It doesn't return anything; it is undefined on n+1. Well, what if we could somehow keep the function "alive" right before it dies. What if we could call the function fib again when it reaches this "death" state? This is what that would look like.

{{< highlight Scheme >}}
((lambda (mk-fib)
  (mk-fib mk-fib))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ ((fib fib) (- n 1)) ((fib fib) (- n 2))))))))
{{< / highlight >}}

Wow that's pretty. And it works! You can try it out for yourself.  But, we aren't done yet; this isn't the general solution we want, and the "fib" function has lost it's "fib" characteristic! Well, if we look closely, we can see that the only thing that changed is that we've applied the parameter twice. Can we abstract that? Yes, we can! Here is what it would look like.

{{< highlight Scheme >}}
((lambda (mk-fib)
  (mk-fib mk-fib))
 (lambda (fib)
  ((lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2)))))))
   (lambda (x) ((fib fib) x)))))
{{< / highlight >}}

Ok, we are so close. Now, let's take the anonymous original function OUT of the "wrapper" functions and we've got the YCombinator.

{{< highlight Scheme >}}
((lambda (f)
  ((lambda (mk-fib)
    (mk-fib mk-fib))
   (lambda (fib)
    (f (lambda (x) ((fib fib) x))))))
  (lambda (fib)
    (lambda (n)
      (cond
        ((zero? n) 0)
        ((zero? (- n 1)) 1)
        (else (+ (fib (- n 1)) (fib (- n 2))))))))
{{< / highlight >}}

Bam. If you try this out in your IDE right now([repl](https://replit.com/) has a scheme interpreter), you'll see that it works! The final step is just cleaning up the variable names. Here is the long awaited YCombinator!

{{< highlight Scheme >}}
(lambda (func)
  ((lambda (f)
    (f f))
   (lambda (f)
    (func (lambda (x) ((f f) x))))))
{{< / highlight >}}

That completely anonymous function DEFINES recursion.

## Fín
If you're confused, you can read this post again, or opt to read chapter 9 of The Little Schemer(Friedman explains it better than I ever could). This 5 line function can be very confusing though, so give it some time. I suggest you open up your IDE of choice, close this blog, and derive the YCombinator on your own, using an example other than the fibonacci series. Some ideas of functions you can try it out with: length(length of a list; The Little Schemer used this example),  power function, sum of a list, and more. The important part is that you actually work through this process, getting stuck and breaking out along the way. You can also write a blog about it too :)
