import { Container, VStack, Input, Button, Heading, ButtonGroup, Flex, Spacer } from '@chakra-ui/react'
import { useState } from 'react'

export default function Index() {
  const [wordStates, setWordStates] = useState([])
  const handleWordClick = id => {
    setWordStates(prev_wordStates => {
      return prev_wordStates.map(s => {
        if (s.id !== id) return s
        return {
          id: id,
          word: s.word,
          color: s.color === 'teal' ? '' : 'teal'
        }
      })
    })
  }

  return (
    <Container maxW='3xl' mt={4} centerContent>
      <VStack spacing={4} width='100%'>
        <Heading size='lg'>Lexicon Service</Heading>
        <Input
          placeholder='Context sentence'
          width='100%'
          onChange={(e) => {
            const sentence = e.target.value.trim()
            console.log(sentence)
            const words = sentence.split(' ').filter((word) => word.length > 0)
            setWordStates(words.map((word, index) => {
              return {
                id: index,
                word: word,
                color: 'teal'
              }
            }))
          }}
        />
        <ButtonGroup size='sm' spacing={4} variant='outline'>
          {wordStates.map((s) => {
            return (
              <Button
                key={s.id}
                colorScheme={s.color}
                onClick={() => handleWordClick(s.id) }>
                {s.word}
              </Button>
            )
          })}
        </ButtonGroup>
        <Flex width='100%'>
          <Spacer />
          <Button colorScheme='teal' variant='solid' isLoading={false} loadingText='Submitting'>
            Add
          </Button>
        </Flex>
      </VStack>
    </Container>
  )
}
