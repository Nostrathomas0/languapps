# coding utf-8
# def assemble(*args):
#T = 'the'
#N
#print(T,N)
#(rintt,n)

def assemble(*args):
    return  " ".join(args)

def NP(T,N):
    return assemble(T,N)

def VP(Verb, NP):
    return assemble(Verb, NP)

def sentence(NP,VP):
    return assemble(NP, VP)

def loop(X):
    D = [ '']
    T = [ 'the', 'this', 'our', 'her', 'his', 'my', 'if', 'because',]
    N = ['woman', 'man', 'child', 'wife', 'husband', 'mother', 'tablet', 'father', 'animal', 'fish', 'bird', 'dog', 'louse', 'snake', 'worm', 'tree', 'forest', 'stick', 'fruit', 'seed', 'leaf', 'root', 'bark', 'flower', 'grass', 'rope', 'skin', 'meat', 'blood', 'bone', 'fat', 'egg', 'horn', 'tail', 'feather', 'hair', 'head', 'ear', 'eye', 'nose', 'mouth', 'tooth', 'tongue', 'fingernail', 'foot', 'leg', 'knee', 'hand', 'wing', 'belly', 'guts', 'neck', 'back', 'breast', 'heart', 'liver' ]
    Verb = ['drinks', 'eats', 'bites', 'sucks', 'spits', 'vomits', 'blows', 'breathes', 'laughs', 'sees', 'hears', 'knows', 'thinks', 'smells', 'fears', 'sleeps','dreams' , 'lives', 'dies', 'kills', 'fights', 'hunts', 'hits', 'cuts', 'splits', 'stabs', 'scratchs', 'digs', 'swims', 'flys', 'walks', 'comes', 'lies', 'sits', 'stands', 'turns', 'falls', 'gives', 'holds', 'squeezes', 'rubs', 'washes', 'wipes', 'pulls', 'pushs', 'throws', 'ties', 'sews', 'counts', 'says', 'sings', 'plays', 'floats', 'flows', 'freezes', 'swells', ]

    import random as ran

    for i in range(X):
        N1, N2  = ran.choice(N), ran.choice(N)
        T1, T2 = ran.choice(T), ran.choice(T)
        Verb1 = ran.choice(Verb)

        NP1 = NP(T1,N1)
        NP2 = NP(T2,N2)
        VP1 = VP(Verb1,NP2)
        print(sentence(NP1,VP1))
loop(11)
#A = 'the'
#N = ['man','house' ]
#V = 'builds'

#NP1 = NP(T,N[0])
#NP2 = NP(T,N[1])

#VP1 = VP(Verb,NP2)

#print(sentence(NP1, VP1))