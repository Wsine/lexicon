import { Container, VStack, Input, Button, Heading, ButtonGroup, Flex, Spacer, Wrap, WrapItem } from '@chakra-ui/react'
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
          selected: !s.selected
        }
      })
    })
  }

  return (
    <Container maxW='3xl' mt={4}>
      <VStack spacing={4}>
        <Heading size='lg'>Lexicon Service</Heading>
        <Input
          placeholder='Context sentence'
          onChange={(e) => {
            const sentence = e.target.value.trim()
            const words = sentence.split(' ').filter((word) => word.length > 0)
            setWordStates(words.map((word, index) => {
              return {
                id: index,
                word: word,
                selected: false
              }
            }))
          }}
        />
        <ButtonGroup size='sm' spacing={4} colorScheme='teal'>
          <Wrap>
            {wordStates.map((s) => {
              return (
                <WrapItem>
                  <Button
                    variant={s.selected ? 'outline' : 'ghost'}
                    onClick={() => handleWordClick(s.id) }>
                    {s.word}
                  </Button>
                </WrapItem>
              )
            })}
          </Wrap>
        </ButtonGroup>
        <Flex w='100%'>
          <Spacer />
          <Button colorScheme='teal' variant='solid' isLoading={false} loadingText='Submitting'>
            Add
          </Button>
        </Flex>
      </VStack>
    </Container>
  )
}
